import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { generateUniqueSlug } from '../utils/helpers';

export async function shopeeSync(req: Request, res: Response, next: NextFunction) {
  try {
    const products = req.body; // Expecting an array of products from Apify

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: 'Payload must be an array of products' });
    }

    const results = {
      total: products.length,
      created: 0,
      updated: 0,
      errors: 0,
    };

    // Find a default category
    const defaultCategory = await prisma.category.findFirst({
      where: { name: { contains: 'Alat Kesehatan', mode: 'insensitive' } }
    }) || await prisma.category.findFirst();

    if (!defaultCategory) {
      return res.status(500).json({ message: 'No category found in database to assign products' });
    }

    for (const item of products) {
      try {
        const name = item.name || item.title;
        if (!name) continue;

        // Clean price (usually in Shopee it might be like 150000000 representing 150.000,00)
        // Apify scrapers often return the human-readable price or raw price.
        // Let's assume the user sends us a sanitized integer price from n8n or we sanitize here.
        let price = parseInt(item.price) || 0;
        // Some scrapers return price in minor units (cents/sen)
        if (price > 10000000) price = Math.round(price / 100000); // Rough check for minor units

        const description = item.description || '';
        const images = Array.isArray(item.images) ? item.images : [item.image].filter(Boolean);
        const shopeeUrl = item.url || item.item_url || `https://shopee.co.id/product/${item.shop_id}/${item.item_id}`;

        // Upsert logic
        const existing = await prisma.product.findFirst({
          where: {
            OR: [
              { shopeeUrl: shopeeUrl },
              { name: name }
            ]
          }
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              price: price > 0 ? price : existing.price,
              description: description || existing.description,
              images: images.length > 0 ? images : existing.images,
              shopeeUrl: shopeeUrl,
              ratingAvg: parseFloat(item.rating_star) || existing.ratingAvg,
            }
          });
          results.updated++;
        } else {
          // Create new
          const slug = await generateUniqueSlug(name);
          await prisma.product.create({
            data: {
              name,
              description,
              price: price || 0,
              images,
              shopeeUrl,
              slug,
              categoryId: defaultCategory.id,
              isActive: true,
              ratingAvg: parseFloat(item.rating_star) || 4.8,
              stockQty: parseInt(item.stock) || 10,
            }
          });
          results.created++;
        }
      } catch (err) {
        console.error('Error syncing individual item:', err);
        results.errors++;
      }
    }

    res.json({
      message: 'Sync completed',
      results
    });
  } catch (err) {
    next(err);
  }
}
