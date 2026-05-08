import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { paginationQuerySchema } from '../utils/schema';

// GET /api/categories
export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });

    res.json(categories.map((c) => ({
      ...c,
      productCount: c._count.products,
      _count: undefined,
    })));
  } catch (err) { next(err); }
}

// GET /api/products
export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId, search, featured, promo, sort, page, limit } = paginationQuerySchema.parse(req.query);

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (featured) where.isFeatured = true;
    if (promo) {
      where.discountPrice = { gt: 0 };
    }
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const orderBy: any = {};
    switch (sort) {
      case 'price_asc': orderBy.price = 'asc'; break;
      case 'price_desc': orderBy.price = 'desc'; break;
      case 'name': orderBy.name = 'asc'; break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true } },
          variants: { where: { isActive: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products.map((p) => ({
        ...p,
        categoryName: p.category?.name || '',
        category: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
}

// GET /api/products/:id
export async function getProduct(req: Request, res: Response, next: NextFunction) {
  type PopulatedProduct = any;

  try {
    const param = req.params.id as string;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(param);

    const product = await prisma.product.findUnique({
      where: isUuid ? { id: param as string } : { slug: param as string },
      include: {
        category: { select: { name: true } },
        variants: { where: { isActive: true } },
        cookingVideos: {
          include: {
            products: {
              where: { isActive: true },
              include: {
                category: { select: { name: true } },
                variants: { where: { isActive: true } },
              },
            },
          },
        },
        flashSaleItems: {
          where: {
            flashSale: {
              startAt: { lte: new Date() },
              endAt: { gte: new Date() },
              isActive: true
            }
          },
          include: {
            flashSale: true
          }
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const toPopulated = (r: any) => ({
      ...r,
      categoryName: r.category?.name ?? '',
      category: undefined,
    });

    const baseSimilarWhere = {
      id: { not: product.id },
      isActive: true,
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    };

    // Run related & similar queries in parallel
    const [relatedRaw, tagSimilarRaw] = await Promise.all([
      product.relatedProductIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: product.relatedProductIds }, isActive: true },
            include: { category: { select: { name: true } }, variants: { where: { isActive: true } } },
          })
        : Promise.resolve([]),
      product.tags.length > 0
        ? prisma.product.findMany({
            where: { ...baseSimilarWhere, tags: { hasSome: product.tags } },
            take: 8,
            include: { category: { select: { name: true } }, variants: { where: { isActive: true } } },
          })
        : Promise.resolve([]),
    ]);

    const populatedRelated: PopulatedProduct[] = relatedRaw.map(toPopulated);
    let populatedSimilar: PopulatedProduct[] = tagSimilarRaw.map(toPopulated);

    // Fallback: fill up to 8 with same-category products if tag results are insufficient
    if (populatedSimilar.length < 8) {
      const excludeIds = [product.id, ...populatedSimilar.map((p) => p.id)];
      const fallback = await prisma.product.findMany({
        where: { ...baseSimilarWhere, id: { notIn: excludeIds } },
        take: 8 - populatedSimilar.length,
        include: { category: { select: { name: true } }, variants: { where: { isActive: true } } },
      });
      populatedSimilar = [...populatedSimilar, ...fallback.map(toPopulated)];
    }

    res.json({
      ...product,
      categoryName: product.category?.name ?? '',
      category: undefined,
      populatedRelatedProducts: populatedRelated,
      populatedSimilarProducts: populatedSimilar,
    });
  } catch (err) { next(err); }
}

// POST /api/cart/validate
export async function validateCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { items } = req.body; // [{ productId, variantId?, qty }]

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    const validated = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.isActive) {
        return { ...item, isAvailable: false, reason: 'Produk tidak tersedia' };
      }

      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : null;

      const unitPrice = product.discountPrice || product.price;
      const variantAdd = variant?.priceAddition || 0;

      const outOfStock = !product.isUnlimitedStock && product.stockQty < item.qty;

      return {
        productId: item.productId,
        variantId: item.variantId || null,
        qty: item.qty,
        productName: product.name,
        productImage: product.images[0] || null,
        unit: product.unit,
        unitPrice: unitPrice + variantAdd,
        variantName: variant?.name || null,
        isAvailable: !outOfStock,
        priceChanged: false,
        reason: outOfStock ? `Stok tersisa ${product.stockQty}` : null,
      };
    });

    res.json({ items: validated });
  } catch (err) { next(err); }
}

// GET /api/banners
export async function getBanners(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(banners);
  } catch (err) { next(err); }
}

export async function getCookingVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);

    const [videos, total] = await Promise.all([
      prisma.cookingVideo.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          products: {
            where: { isActive: true },
            include: {
              category: { select: { name: true } },
              variants: { where: { isActive: true } },
            },
          },
        },
      }),
      prisma.cookingVideo.count(),
    ]);

    res.json({
      data: videos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
}
