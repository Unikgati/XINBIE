import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

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
    const {
      categoryId,
      search,
      featured,
      promo,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (featured === 'true') where.isFeatured = true;
    if (promo === 'true') {
      where.discountPrice = { gt: 0 };
    }
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const orderBy: any = {};
    switch (sort) {
      case 'price_asc': orderBy.price = 'asc'; break;
      case 'price_desc': orderBy.price = 'desc'; break;
      case 'name': orderBy.name = 'asc'; break;
      default: orderBy.createdAt = 'desc';
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
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
        categoryName: p.category.name,
        category: undefined,
      })),
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) { next(err); }
}

// GET /api/products/:id
export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { name: true } },
        variants: { where: { isActive: true } },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ ...product, categoryName: product.category.name, category: undefined });
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
