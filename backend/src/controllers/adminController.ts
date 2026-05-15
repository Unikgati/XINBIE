import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { idParamSchema, paginationQuerySchema } from '../utils/schema';
import slugify from 'slugify';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { processAndUploadImage, processAndUploadImages } from '../middleware/upload';
import { emitToAdmins, broadcastOrderOffer } from '../websocket';
import { NotificationService } from '../utils/notification';
import { generateUniqueSlug } from '../utils/helpers';

// ═══════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════

export async function getUnreadCounts(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await prisma.productReview.count({
      where: { isActive: false }
    });
    res.json({ reviews });
  } catch (err) { next(err); }
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [totalProducts, activeProducts, totalCategories, topProducts, siteAnalytics] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.product.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, name: true, viewCount: true, images: true, stockQty: true }
      }),
      prisma.siteAnalytics.aggregate({
        _sum: { visitorCount: true }
      })
    ]);

    res.json({
      stats: {
        totalProducts,
        activeProducts,
        totalCategories,
        totalVisitors: siteAnalytics._sum.visitorCount || 0,
      },
      topProducts,
    });
  } catch (err) { next(err); }
}

export async function getDetailedAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [locations, dailyVisitors] = await Promise.all([
      prisma.siteAnalyticsLocation.groupBy({
        by: ['city', 'region'],
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
        take: 15
      }),
      prisma.siteAnalytics.findMany({
        orderBy: { date: 'desc' },
        take: 30
      })
    ]);

    res.json({
      locations: locations.map(l => ({
        city: l.city,
        region: l.region,
        count: l._sum.count || 0
      })),
      dailyVisitors: dailyVisitors.reverse()
    });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Products CRUD
// ═══════════════════════════════════════

export async function adminGetProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '20', search, categoryId } = req.query;
    const where: any = {};
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          cookingVideos: { select: { id: true, title: true } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ data: products, meta: { total, page: parseInt(page as string) } });
  } catch (err) { next(err); }
}

const parseProductData = (body: any) => {
  const data: any = {};
  
  // Whitelist of fields allowed in Prisma Product model
  const allowedFields = [
    'name', 'description', 'categoryId', 'price', 'costPrice', 
    'discountPrice', 'unit', 'weightGram', 'isUnlimitedStock', 
    'isActive', 'isFeatured', 'sortOrder', 'shopeeUrl', 'ratingAvg',
    'tags', 'sizes'
  ];

  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  });

  // Remap 'stock' to 'stockQty' (compatibility with older frontend)
  if (body.stock !== undefined) {
    data.stockQty = parseInt(body.stock) || 0;
  } else if (body.stockQty !== undefined) {
    data.stockQty = parseInt(body.stockQty) || 0;
  }

  // Convert numeric types
  if (data.price !== undefined) {
      const parsedPrice = parseInt(data.price);
      data.price = isNaN(parsedPrice) ? existingVariant.product.price : parsedPrice;
    }
    if (data.costPrice !== undefined) {
      const parsedCostPrice = parseInt(data.costPrice);
      data.costPrice = isNaN(parsedCostPrice) ? existingVariant.product.costPrice : parsedCostPrice;
    }
  if (data.discountPrice !== undefined) {
    const parsed = parseInt(data.discountPrice);
    data.discountPrice = isNaN(parsed) || parsed < 0 ? null : parsed;
  }
  if (data.weightGram !== undefined) {
    const parsed = parseInt(data.weightGram);
    data.weightGram = isNaN(parsed) ? null : parsed;
  }
  if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder) || 0;
  if (data.ratingAvg !== undefined) data.ratingAvg = parseFloat(data.ratingAvg) || 4.8;

  // Convert booleans
  if (data.isActive !== undefined) data.isActive = String(data.isActive) === 'true';
  if (data.isFeatured !== undefined) data.isFeatured = String(data.isFeatured) === 'true';
  if (data.isUnlimitedStock !== undefined) data.isUnlimitedStock = String(data.isUnlimitedStock) === 'true';

  // Handle arrays from FormData and split by comma if needed
  if (body.tags !== undefined) {
    let rawTags = Array.isArray(body.tags) ? body.tags : [body.tags];
    data.tags = rawTags.flatMap(t => String(t).split(',')).map(t => t.trim()).filter(Boolean);
  }
  if (body.sizes !== undefined) {
    let rawSizes = Array.isArray(body.sizes) ? body.sizes : [body.sizes];
    data.sizes = rawSizes.flatMap(s => String(s).split(',')).map(s => s.trim()).filter(Boolean);
  }

  // Handle category relation
  if (data.categoryId) {
    data.category = { connect: { id: data.categoryId } };
    delete data.categoryId;
  }

  // Auto-calculate discountPercent
  if (data.price && data.price > 0 && data.discountPrice !== null && data.discountPrice > 0 && data.discountPrice < data.price) {
    data.discountPercent = Math.round(((data.price - data.discountPrice) / data.price) * 100);
  } else {
    data.discountPercent = null;
  }

  // Clean up description
  if (typeof data.description === 'string') {
    data.description = data.description.replace(/&nbsp;/g, ' ');
  }

  return data;
};


export async function adminCreateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = parseProductData(req.body);
    const variantsRaw = req.body.variants; // Expecting JSON string
    let variantsData = [];
    if (variantsRaw) {
      try {
        variantsData = JSON.parse(variantsRaw);
      } catch (e) {
        throw new AppError('Format data varian tidak valid', 400);
      }
    }

    let productImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      // Find files that belong to product images (not variants)
      // Usually multer files have fieldname like 'images' for product, 'variant_image_0' for variants
      const prodFiles = (req.files as Express.Multer.File[]).filter(f => f.fieldname === 'images');
      productImages = await processAndUploadImages(prodFiles, 'products');
    }

    data.images = productImages;
    data.slug = await generateUniqueSlug(data.name);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({ data });

      // 2. Create Variants if any
      if (variantsData.length > 0) {
        for (let i = 0; i < variantsData.length; i++) {
          const v = variantsData[i];
          let variantImageUrl = null;
          
          // Look for variant file in req.files
          const variantFile = (req.files as Express.Multer.File[]).find(f => f.fieldname === `variant_image_${i}`);
          if (variantFile) {
            variantImageUrl = await processAndUploadImage(variantFile, 'variants');
          }

          await tx.productVariant.create({
            data: {
              productId: product.id,
              name: v.name,
              price: parseInt(v.price) || 0,
              costPrice: parseInt(v.costPrice) || 0,
              discountPrice: v.discountPrice ? parseInt(v.discountPrice) : null,
              stockQty: parseInt(v.stockQty) || 0,
              imageUrl: variantImageUrl,
              isActive: true
            }
          });
        }
      }
      return product;
    });

    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function adminUpdateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = parseProductData(req.body);
    const variantsRaw = req.body.variants; // JSON string
    const deletedVariantsRaw = req.body.deletedVariants; // JSON string (array of IDs)
    
    let variantsData = [];
    if (variantsRaw) variantsData = JSON.parse(variantsRaw);
    
    let deletedVariantIds = [];
    if (deletedVariantsRaw) deletedVariantIds = JSON.parse(deletedVariantsRaw);

    let newProductImages: string[] | undefined;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const prodFiles = (req.files as Express.Multer.File[]).filter(f => f.fieldname === 'images');
      if (prodFiles.length > 0) {
        newProductImages = await processAndUploadImages(prodFiles, 'products');
      }
    }

    if (newProductImages) data.images = newProductImages;
    if (data.name) {
      data.slug = await generateUniqueSlug(data.name, id);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product
      const product = await tx.product.update({
        where: { id },
        data: data,
      });

      // 2. Delete removed variants
      if (deletedVariantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: deletedVariantIds }, productId: id }
        });
      }

      // 3. Upsert Variants
      if (variantsData.length > 0) {
        for (let i = 0; i < variantsData.length; i++) {
          const v = variantsData[i];
          let variantImageUrl = v.imageUrl || null;
          
          // Check for new file upload for this variant
          const variantFile = (req.files as Express.Multer.File[]).find(f => f.fieldname === `variant_image_${i}`);
          if (variantFile) {
            variantImageUrl = await processAndUploadImage(variantFile, 'variants');
          }

          const variantFields = {
            name: v.name,
            price: parseInt(v.price) || 0,
            costPrice: parseInt(v.costPrice) || 0,
            discountPrice: v.discountPrice ? parseInt(v.discountPrice) : null,
            stockQty: parseInt(v.stockQty) || 0,
            imageUrl: variantImageUrl,
          };

          if (v.id && v.id.length > 10) { // Simple check if it's a real UUID
            await tx.productVariant.update({
              where: { id: v.id },
              data: variantFields
            });
          } else {
            await tx.productVariant.create({
              data: {
                ...variantFields,
                productId: id,
                isActive: true
              }
            });
          }
        }
      }
      return product;
    });

    res.json(result);
  } catch (err) { next(err); }
}

export async function adminDeleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: true }
    });
    if (!existingVariant) throw new AppError('Varian tidak ditemukan', 404);
    await prisma.product.delete({
      where: { id },
    });
    res.json({ message: 'Produk dihapus' });
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

// ═══════════════════════════════════════
// Admin Product Variants CRUD
// ═══════════════════════════════════════

export async function adminGetVariants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = z.object({ productId: z.string().min(1) }).parse(req.params);
    const baseProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!baseProduct) throw new AppError('Produk utama tidak ditemukan', 404);
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(variants);
  } catch (err) { next(err); }
}

export async function adminCreateVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = z.object({ productId: z.string().min(1) }).parse(req.params);
    let imageUrl: string | undefined;
    if (req.file) imageUrl = await processAndUploadImage(req.file, 'variants');
    let parsedPrice = parseInt(req.body.price);
    let parsedCostPrice = parseInt(req.body.costPrice);

    const data = {
      productId,
      name: req.body.name,
      sku: req.body.sku || null,
      price: isNaN(parsedPrice) ? baseProduct.price : parsedPrice,
      costPrice: isNaN(parsedCostPrice) ? baseProduct.costPrice : parsedCostPrice,
      discountPrice: req.body.discountPrice ? parseInt(req.body.discountPrice) : null,
      priceAddition: parseInt(req.body.priceAddition) || 0,
      stockQty: parseInt(req.body.stockQty) || 0,
      imageUrl: imageUrl || null,
      sortOrder: parseInt(req.body.sortOrder) || 0,
      isActive: req.body.isActive === undefined ? true : String(req.body.isActive) === 'true',
    };

    const variant = await prisma.productVariant.create({ data });
    res.status(201).json(variant);
  } catch (err) { next(err); }
}

export async function adminUpdateVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    let imageUrl: string | undefined;
    if (req.file) imageUrl = await processAndUploadImage(req.file, 'variants');

    const data: any = {};
    const allowed = ['name', 'sku', 'price', 'costPrice', 'discountPrice', 'priceAddition', 'stockQty', 'sortOrder', 'isActive'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    if (imageUrl) data.imageUrl = imageUrl;
    if (data.price !== undefined) data.price = parseInt(data.price) || 0;
    if (data.costPrice !== undefined) data.costPrice = parseInt(data.costPrice) || 0;
    if (data.discountPrice !== undefined) {
      const parsed = parseInt(data.discountPrice);
      data.discountPrice = isNaN(parsed) ? null : parsed;
    }
    if (data.priceAddition !== undefined) data.priceAddition = parseInt(data.priceAddition) || 0;
    if (data.stockQty !== undefined) data.stockQty = parseInt(data.stockQty) || 0;
    if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder) || 0;
    if (data.isActive !== undefined) data.isActive = String(data.isActive) === 'true';

    const variant = await prisma.productVariant.update({
      where: { id },
      data,
    });
    res.json(variant);
  } catch (err) { next(err); }
}

export async function adminDeleteVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await prisma.productVariant.delete({
      where: { id },
    });
    res.json({ message: 'Varian dihapus' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Categories CRUD
// ═══════════════════════════════════════

export async function adminGetCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (err) { next(err); }
}

function generateSlug(text: string) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

export async function adminCreateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let iconUrl: string | undefined;
    if (req.file) iconUrl = await processAndUploadImage(req.file, 'categories');

    const data = {
      name: req.body.name,
      slug: generateSlug(req.body.name),
      iconUrl: iconUrl || null,
      isActive: req.body.isActive === undefined ? true : String(req.body.isActive) === 'true',
      sortOrder: parseInt(req.body.sortOrder) || (await prisma.category.count()) + 1,
    };

    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (err) { next(err); }
}

export async function adminUpdateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    let iconUrl: string | undefined;
    if (req.file) iconUrl = await processAndUploadImage(req.file, 'categories');

    const data: any = {};
    const allowed = ['name', 'isActive', 'sortOrder'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    if (iconUrl) data.iconUrl = iconUrl;
    if (data.name) data.slug = generateSlug(data.name);
    if (data.isActive !== undefined) data.isActive = String(data.isActive) === 'true';
    if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder) || 0;

    const category = await prisma.category.update({
      where: { id },
      data: data,
    });
    res.json(category);
  } catch (err) { next(err); }
}

export async function adminReorderCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError('orderedIds wajib berupa array', 400);
    }

    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({ where: { id }, data: { sortOrder: index + 1 } })
      )
    );

    res.json({ message: 'Urutan kategori diperbarui' });
  } catch (err) { next(err); }
}

export async function adminDeleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError(`Kategori tidak bisa dihapus karena masih memiliki ${productCount} produk. Pindahkan produk ke kategori lain terlebih dahulu.`, 400);
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Orders
// ═══════════════════════════════════════

export async function adminGetOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, page = 1, limit = 20, search } = paginationQuerySchema.merge(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    })).parse(req.query);

    const where: Prisma.OrderWhereInput = {};
    if (status) {
      const statuses = status.split(',');
      where.orderStatus = statuses.length > 1 ? { in: statuses as any } : statuses[0] as any;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, phoneWa: true } },
          driver: { select: { name: true, phoneWa: true } },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ data: orders, meta: { total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

export async function adminGetOrderDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phoneWa: true, avatarUrl: true } },
        driver: { select: { id: true, name: true, phoneWa: true, avatarUrl: true, driverProfile: { select: { id: true } } } },
        deliverySlot: true,
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    res.json(order);
  } catch (err) { next(err); }
}

export async function adminUpdateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, note, driverId, pickupPointId } = req.body;
    const data: any = { orderStatus: status };
    if (driverId) data.driverId = driverId;
    if (pickupPointId) data.pickupPointId = pickupPointId;

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data,
        select: { id: true, userId: true, orderStatus: true, code: true },
      }),
      prisma.orderStatusLog.create({
        data: { orderId: id, status, actorId: req.userId, note: note || 'Admin update' },
      }),
    ]);

    // Broadcast to admins + notify user
    emitToAdmins('order:statusUpdate', { orderId: id, status });
    NotificationService.notifyOrderStatus(updatedOrder.userId, updatedOrder.id, updatedOrder.code, status);

    // Push notification to online drivers when WAITING_DRIVER
    if (status === 'WAITING_DRIVER') {
      const onlineDrivers = await prisma.driverProfile.findMany({
        where: { isOnline: true, verificationStatus: 'APPROVED' },
        select: { user: { select: { fcmToken: true } } },
      });
      const tokens = onlineDrivers
        .map((d) => d.user.fcmToken)
        .filter((t): t is string => !!t);

      if (tokens.length > 0) {
        await sendPushToMultiple(tokens, {
          title: '🔔 Pesanan Baru!',
          body: `Pesanan ${updatedOrder.code} menunggu driver`,
          data: { type: 'new_order', orderId: id },
        });
      }

      // 🔴 Send websocket event for Interruptive UI (IncomingOrderOverlay)
      const fullOrder = await prisma.order.findUnique({
        where: { id },
      });
      if (fullOrder) {
        broadcastOrderOffer(id, {
          orderId: fullOrder.id,
          code: fullOrder.code,
          grandTotal: fullOrder.grandTotal,
          deliveryFee: fullOrder.deliveryFee,
          addressSnapshot: fullOrder.addressSnapshot,
        });
      }
    }

    res.json({ message: 'Status pesanan diperbarui' });
  } catch (err) { next(err); }
}

export async function adminGetUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [unreadCount, pendingDriversCount] = await Promise.all([
      prisma.order.count({ where: { isReadAdmin: false } }),
      prisma.driverProfile.count({ where: { verificationStatus: 'PENDING' } })
    ]);
    res.json({ unreadCount, pendingDriversCount });
  } catch (err) { next(err); }
}

export async function adminMarkOrderAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await prisma.order.update({
      where: { id },
      data: { isReadAdmin: true },
    });
    res.json({ message: 'Order marked as read' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Drivers
// ═══════════════════════════════════════

export async function adminGetDrivers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = z.object({ status: z.string().optional() }).parse(req.query);
    const where: Prisma.DriverProfileWhereInput = {};
    if (status) where.verificationStatus = status as any;

    const drivers = await prisma.driverProfile.findMany({
      where,
      include: { user: { select: { name: true, email: true, phoneWa: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(drivers.map((d) => ({
      ...d,
      userName: d.user.name, userEmail: d.user.email,
      userPhoneWa: d.user.phoneWa, userAvatarUrl: d.user.avatarUrl,
      user: undefined,
    })));
  } catch (err) { next(err); }
}

export async function adminGetDriverDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id: driverId } = idParamSchema.parse(req.params);
    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: {
        user: { select: { name: true, email: true, phoneWa: true, avatarUrl: true, isActive: true } },
      },
    });

    if (!driver) throw new AppError('Driver tidak ditemukan', 404);

    const [totalOrders, lastOrder] = await Promise.all([
      prisma.order.count({ where: { driverId } }),
      prisma.order.findFirst({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const orders = await prisma.order.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, code: true, orderStatus: true, paymentStatus: true,
        grandTotal: true, createdAt: true, isReadAdmin: true,
        _count: { select: { items: true } },
        user: { select: { name: true } },
      },
    });

    res.json({
      ...driver,
      userName: (driver as any).user.name,
      userEmail: (driver as any).user.email,
      userPhoneWa: (driver as any).user.phoneWa,
      userAvatarUrl: (driver as any).user.avatarUrl,
      userIsActive: (driver as any).user.isActive,
      user: undefined,
      stats: {
        totalOrders,
        lastOrderAt: lastOrder?.createdAt || null,
      },
      orders: orders.map(o => ({
        id: o.id,
        code: o.code,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        grandTotal: o.grandTotal,
        createdAt: o.createdAt,
        isReadAdmin: o.isReadAdmin,
        itemCount: (o as any)._count.items,
        customerName: (o as any).user.name,
      })),
    });
  } catch (err) { next(err); }
}

export async function adminVerifyDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, rejectionReason } = req.body;

    await prisma.driverProfile.update({
      where: { id: req.params.id as string },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
        verifiedBy: req.userId,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });

    res.json({ message: `Driver ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}` });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Users
// ═══════════════════════════════════════

export async function adminGetUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '20';
    const search = req.query.search as string;
    const where: any = { role: 'USER' };
    if (search) where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users.map(({ password, ...u }) => u),
      meta: { total, page: parseInt(page as string) },
    });
  } catch (err) { next(err); }
}

export async function adminToggleUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isActive: !user.isActive },
    });

    res.json({ message: user.isActive ? 'User dinonaktifkan' : 'User diaktifkan' });
  } catch (err) { next(err); }
}

export async function adminGetUserDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true, name: true, email: true, phoneWa: true,
        avatarUrl: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    // Stats
    const [totalOrders, spending, lastOrder] = await Promise.all([
      prisma.order.count({ where: { userId: userId as string } }),
      prisma.order.aggregate({
        where: { userId: userId as string, orderStatus: { notIn: ['CANCELLED'] } },
        _sum: { grandTotal: true },
      }),
      prisma.order.findFirst({
        where: { userId: userId as string },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Addresses
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    // Resolve region names for addresses
    const allRegionIds = addresses.flatMap(a =>
      [a.provinceId, a.cityId, a.districtId, a.villageId].filter(Boolean) as string[]
    );
    const uniqueIds = [...new Set(allRegionIds)];

    let regionMap = new Map<string, string>();
    if (uniqueIds.length > 0) {
      const [provinces, cities, districts, villages] = await Promise.all([
        prisma.province.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, name: true } }),
        prisma.city.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, name: true } }),
        prisma.district.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, name: true } }),
        prisma.village.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, name: true } }),
      ]);
      [...provinces, ...cities, ...districts, ...villages].forEach(r => regionMap.set(r.id, r.name));
    }

    const addressesWithRegion = addresses.map(a => ({
      ...a,
      provinceName: a.provinceId ? regionMap.get(a.provinceId) : undefined,
      cityName: a.cityId ? regionMap.get(a.cityId) : undefined,
      districtName: a.districtId ? regionMap.get(a.districtId) : undefined,
      villageName: a.villageId ? regionMap.get(a.villageId) : undefined,
    }));

    // Recent orders (last 10)
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, code: true, orderStatus: true, paymentStatus: true,
        grandTotal: true, createdAt: true, isReadAdmin: true,
        _count: { select: { items: true } },
      },
    });

    res.json({
      user,
      stats: {
        totalOrders,
        totalSpent: spending._sum?.grandTotal || 0,
        lastOrderAt: lastOrder?.createdAt || null,
      },
      addresses: addressesWithRegion,
      orders: orders.map(o => ({
        id: o.id,
        code: o.code,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        grandTotal: o.grandTotal,
        createdAt: o.createdAt,
        isReadAdmin: o.isReadAdmin,
        itemCount: (o as any)._count.items,
      })),
    });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Banners CRUD
// ═══════════════════════════════════════

export async function adminGetBanners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(banners);
  } catch (err) { next(err); }
}

export async function adminCreateBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('Gambar banner wajib diupload', 400);
    const imageUrl = await processAndUploadImage(req.file, 'banners', 1200, 90);

    const data = {
      title: req.body.title || 'Banner',
      type: req.body.type || 'PROMO',
      imageUrl,
      actionType: req.body.actionType || 'NONE',
      actionValue: req.body.actionValue || null,
      isActive: req.body.isActive === undefined ? true : String(req.body.isActive) === 'true',
      sortOrder: parseInt(req.body.sortOrder) || (await prisma.banner.count()) + 1,
    };

    const banner = await prisma.banner.create({ data: data as any });
    res.status(201).json(banner);
  } catch (err) { next(err); }
}

export async function adminUpdateBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let imageUrl: string | undefined;
    if (req.file) imageUrl = await processAndUploadImage(req.file, 'banners', 1200, 90);

    const data: any = {};
    const allowed = ['title', 'type', 'actionType', 'actionValue', 'isActive', 'sortOrder'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    if (imageUrl) data.imageUrl = imageUrl;
    if (data.isActive !== undefined) data.isActive = String(data.isActive) === 'true';
    if (data.sortOrder !== undefined) data.sortOrder = parseInt(data.sortOrder) || 0;

    const banner = await prisma.banner.update({ where: { id }, data });
    res.json(banner);
  } catch (err) { next(err); }
}

export async function adminReorderBanners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError('orderedIds wajib berupa array', 400);
    }

    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.banner.update({ where: { id }, data: { sortOrder: index + 1 } })
      )
    );

    res.json({ message: 'Urutan banner diperbarui' });
  } catch (err) { next(err); }
}

export async function adminDeleteBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.banner.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Banner dihapus' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Promos CRUD
// ═══════════════════════════════════════

export async function adminGetPromos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const promos = await prisma.promoCode.findMany({ 
      include: { categories: true, products: true },
      orderBy: { createdAt: 'desc' } 
    });
    res.json(promos);
  } catch (err) { next(err); }
}

export async function adminCreatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = { ...req.body };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    if (data.value) data.value = Number(data.value);
    if (data.minOrder) data.minOrder = Number(data.minOrder);
    if (data.maxDiscount) data.maxDiscount = Number(data.maxDiscount);
    if (data.totalUsageLimit) data.totalUsageLimit = Number(data.totalUsageLimit);
    if (data.perUserLimit) data.perUserLimit = Number(data.perUserLimit);
    if (data.allowCod !== undefined) data.allowCod = String(data.allowCod) === 'true';
    if (data.allowedPaymentMethods && Array.isArray(data.allowedPaymentMethods)) {
      data.allowedPaymentMethods = data.allowedPaymentMethods.map((m: string) => m.toUpperCase());
    }

    const { categoryIds, productIds, ...promoData } = data;

    const promo = await prisma.promoCode.create({ 
      data: {
        ...promoData,
        categories: categoryIds ? { connect: categoryIds.map((id: string) => ({ id })) } : undefined,
        products: productIds ? { connect: productIds.map((id: string) => ({ id })) } : undefined,
      } 
    });
    res.status(201).json(promo);
  } catch (err) { next(err); }
}

export async function adminUpdatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = { ...req.body };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    if (data.value) data.value = Number(data.value);
    if (data.minOrder) data.minOrder = Number(data.minOrder);
    if (data.maxDiscount) data.maxDiscount = Number(data.maxDiscount);
    if (data.totalUsageLimit) data.totalUsageLimit = Number(data.totalUsageLimit);
    if (data.perUserLimit) data.perUserLimit = Number(data.perUserLimit);
    if (data.allowCod !== undefined) data.allowCod = String(data.allowCod) === 'true';
    if (data.allowedPaymentMethods && Array.isArray(data.allowedPaymentMethods)) {
      data.allowedPaymentMethods = data.allowedPaymentMethods.map((m: string) => m.toUpperCase());
    }

    const { categoryIds, productIds, ...promoData } = data;

    const promo = await prisma.promoCode.update({ 
      where: { id: req.params.id as string }, 
      data: {
        ...promoData,
        categories: categoryIds ? { set: categoryIds.map((id: string) => ({ id })) } : undefined,
        products: productIds ? { set: productIds.map((id: string) => ({ id })) } : undefined,
      }
    });
    res.json(promo);
  } catch (err) { next(err); }
}

export async function adminDeletePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const usageCount = await prisma.promoUsage.count({ where: { promoCodeId: id as string } });
    if (usageCount > 0) {
      throw new AppError('Voucher tidak bisa dihapus karena sudah memiliki riwayat penggunaan. Silakan nonaktifkan saja.', 400);
    }
    
    await prisma.promoCode.delete({ where: { id: id as string } });
    res.json({ message: 'Voucher berhasil dihapus' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Settings
// ═══════════════════════════════════════

export async function adminGetSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.appSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    res.json(map);
  } catch (err) { next(err); }
}

export async function adminUpdateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const entries = Object.entries(req.body) as [string, string][];
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    );
    res.json({ message: 'Settings diperbarui' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Broadcast
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// Driver Financial & Withdrawals
// ═══════════════════════════════════════

// GET /api/admin/withdrawals?status=PENDING
export async function adminGetWithdrawals(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = { type: 'WITHDRAWAL' };
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.driverTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          wallet: {
            include: {
              user: {
                select: { id: true, name: true, phoneWa: true, driverProfile: { select: { bankName: true, accountNumber: true, accountHolder: true } } },
              },
            },
          },
        },
      }),
      prisma.driverTransaction.count({ where }),
    ]);

    res.json({
      data: transactions.map(t => ({
        id: t.id,
        amount: Math.abs(t.amount),
        status: t.status,
        note: t.note,
        createdAt: t.createdAt,
        driver: {
          id: t.wallet.user.id,
          name: t.wallet.user.name,
          phone: t.wallet.user.phoneWa,
          bankName: t.wallet.user.driverProfile?.bankName,
          accountNumber: t.wallet.user.driverProfile?.accountNumber,
          accountHolder: t.wallet.user.driverProfile?.accountHolder,
        },
      })),
      meta: { total, page: parseInt(page as string) },
    });
  } catch (err) { next(err); }
}

// PUT /api/admin/withdrawals/:id
export async function adminProcessWithdrawal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { action, note } = req.body; // action: 'approve' | 'reject' | 'complete'

    const transaction = await prisma.driverTransaction.findUnique({
      where: { id: id as string },
      include: { wallet: true },
    });
    if (!transaction) throw new AppError('Transaksi tidak ditemukan', 404);
    if (transaction.type !== 'WITHDRAWAL') throw new AppError('Bukan transaksi withdrawal', 400);

    let newStatus: string;

    switch (action) {
      case 'approve':
        if (transaction.status !== 'PENDING') throw new AppError('Hanya bisa approve status PENDING', 400);
        newStatus = 'APPROVED';
        break;
      case 'complete':
        if (transaction.status !== 'PENDING' && transaction.status !== 'APPROVED') {
          throw new AppError('Hanya bisa complete status PENDING/APPROVED', 400);
        }
        newStatus = 'COMPLETED';
        break;
      case 'reject':
        if (transaction.status !== 'PENDING') throw new AppError('Hanya bisa reject status PENDING', 400);
        newStatus = 'REJECTED';
        // Refund balance
        await prisma.driverWallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: Math.abs(transaction.amount) } },
        });
        break;
      default:
        throw new AppError('Action harus: approve, reject, atau complete', 400);
    }

    await prisma.driverTransaction.update({
      where: { id: id as string },
      data: {
        status: newStatus as any,
        note: note ? `${transaction.note} | Admin: ${note}` : transaction.note,
      },
    });

    res.json({ message: `Withdrawal ${action}d`, status: newStatus });
  } catch (err) { next(err); }
}

// GET /api/admin/drivers/:id/financial
export async function adminGetDriverFinancial(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, phoneWa: true,
        driverProfile: {
          select: {
            bankName: true, accountNumber: true, accountHolder: true,
            vehicleType: true, vehiclePlate: true, ratingAvg: true, totalOrdersDone: true,
          },
        },
        driverWallet: {
          select: {
            balance: true,
            transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          },
        },
      },
    });

    if (!user) throw new AppError('Driver tidak ditemukan', 404);

    // Aggregate stats
    const wallet = user.driverWallet;
    const transactions = wallet?.transactions || [];
    const totalCommission = transactions.filter((t: any) => t.type === 'COMMISSION').reduce((s: number, t: any) => s + t.amount, 0);
    const totalWithdrawn = transactions.filter((t: any) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const pendingWithdrawals = transactions.filter((t: any) => t.type === 'WITHDRAWAL' && t.status === 'PENDING').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

    res.json({
      driver: {
        id: user.id,
        name: user.name,
        phone: user.phoneWa,
        ...(user.driverProfile || {}),
      },
      financial: {
        balance: wallet?.balance || 0,
        totalCommission,
        totalWithdrawn,
        pendingWithdrawals,
      },
      transactions,
    });
  } catch (err) { next(err); }
}

// POST /api/admin/drivers/:id/adjustment
export async function adminDriverAdjustment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { type, amount, note } = req.body; // type: 'BONUS' | 'PENALTY'

    if (!['BONUS', 'PENALTY'].includes(type)) throw new AppError('Type harus BONUS atau PENALTY', 400);
    if (!amount || amount <= 0) throw new AppError('Amount harus > 0', 400);

    const adjustedAmount = type === 'PENALTY' ? -amount : amount;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.driverWallet.upsert({
        where: { userId: id as string },
        create: { userId: id as string, balance: adjustedAmount },
        update: { balance: { increment: adjustedAmount } },
      });

      const transaction = await tx.driverTransaction.create({
        data: {
          walletId: wallet.id,
          type: type as any,
          amount: adjustedAmount,
          balance: wallet.balance,
          note: note || `${type === 'BONUS' ? 'Bonus' : 'Penalti'} dari admin`,
        },
      });

      return { transaction, newBalance: wallet.balance };
    });

    res.json({ message: `${type} berhasil diterapkan`, ...result });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Delivery Slots (Admin)
// ═══════════════════════════════════════

export async function adminGetDeliverySlots(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const slots = await prisma.deliverySlot.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    res.json(slots);
  } catch (err) { next(err); }
}

export async function adminCreateDeliverySlot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { dayOfWeek, label, startTime, endTime, maxOrders, cutoffHours, isActive } = req.body;
    const slot = await prisma.deliverySlot.create({
      data: {
        dayOfWeek: parseInt(dayOfWeek),
        label,
        startTime,
        endTime,
        maxOrders: maxOrders ? parseInt(maxOrders) : undefined,
        cutoffHours: cutoffHours ? parseInt(cutoffHours) : undefined,
        isActive: isActive ?? true,
      },
    });
    res.status(201).json(slot);
  } catch (err) { next(err); }
}

export async function adminUpdateDeliverySlotsByDay(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dayOfWeek = parseInt(req.params.day as string);
    const { slots, maxOrders, cutoffHours } = req.body;

    // slots is an array of: { label, startTime, endTime, isActive }

    const results = [];

    for (const slotDef of slots) {
      const { label, startTime, endTime, isActive } = slotDef;

      const existing = await prisma.deliverySlot.findFirst({
        where: { dayOfWeek, label }
      });

      if (existing) {
        if (isActive) {
          // Update to active with new times
          const updated = await prisma.deliverySlot.update({
            where: { id: existing.id },
            data: { isActive: true, startTime, endTime, maxOrders, cutoffHours }
          });
          results.push(updated);
        } else {
          // Deactivate
          const count = await prisma.order.count({ where: { deliverySlotId: existing.id } });
          if (count > 0) {
            // Soft delete
            const updated = await prisma.deliverySlot.update({
              where: { id: existing.id },
              data: { isActive: false, maxOrders, cutoffHours }
            });
            results.push(updated);
          } else {
            // Hard delete
            await prisma.deliverySlot.delete({ where: { id: existing.id } });
          }
        }
      } else {
        if (isActive) {
          // Create new
          const created = await prisma.deliverySlot.create({
            data: { dayOfWeek, label, startTime, endTime, maxOrders, cutoffHours, isActive: true }
          });
          results.push(created);
        }
      }
    }

    res.json({ message: 'Jadwal berhasil diperbarui', slots: results });
  } catch (err) { next(err); }
}

export async function adminUpdateDeliverySlot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { dayOfWeek, label, startTime, endTime, maxOrders, cutoffHours, isActive } = req.body;

    const slot = await prisma.deliverySlot.update({
      where: { id: id as string },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
        ...(label && { label }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(maxOrders !== undefined && { maxOrders: parseInt(maxOrders) }),
        ...(cutoffHours !== undefined && { cutoffHours: parseInt(cutoffHours) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(slot);
  } catch (err) { next(err); }
}

export async function adminDeleteDeliverySlot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const count = await prisma.order.count({ where: { deliverySlotId: id as string } });
    if (count > 0) {
      // Soft delete
      const slot = await prisma.deliverySlot.update({
        where: { id: id as string },
        data: { isActive: false },
      });
      return res.json({ message: 'Slot disembunyikan (Soft Delete) karena masih memiliki pesanan aktif', slot, softDeleted: true });
    }

    await prisma.deliverySlot.delete({ where: { id: id as string } });
    res.json({ message: 'Slot berhasil dihapus permanen' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Cooking Videos CRUD
// ═══════════════════════════════════════

export async function adminGetCookingVideos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const videos = await prisma.cookingVideo.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        products: { select: { id: true, name: true } },
      },
    });
    res.json(videos);
  } catch (err) { next(err); }
}

export async function adminCreateCookingVideo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, videoUrl, productIds } = req.body;
    const video = await prisma.cookingVideo.create({
      data: {
        title,
        youtubeUrl: videoUrl,
        products: {
          connect: Array.isArray(productIds) ? productIds.map((id: string) => ({ id })) : [],
        },
      },
    });
    res.status(201).json(video);
  } catch (err) { next(err); }
}

export async function adminUpdateCookingVideo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, videoUrl, productIds } = req.body;
    const video = await prisma.cookingVideo.update({
      where: { id: req.params.id as string },
      data: {
        title,
        youtubeUrl: videoUrl,
        products: {
          set: Array.isArray(productIds) ? productIds.map((id: string) => ({ id })) : [],
        },
      },
    });
    res.json(video);
  } catch (err) { next(err); }
}

export async function adminDeleteCookingVideo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.cookingVideo.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Video inspirasi dihapus' });
  } catch (err) { next(err); }
}
