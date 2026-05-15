import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { paginationQuerySchema } from '../utils/schema';
import geoip from 'geoip-lite';

function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const bots = [
    'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 
    'baiduspider', 'ia_archiver', 'facebot', 'facebookexternalhit',
    'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview',
    'showyoubot', 'outbrain', 'pinterest/0.', 'developers.google.com/+/web/snippet',
    'slackbot', 'vkShare', 'W3C_Validator', 'redditbot', 'Applebot', 'WhatsApp',
    'TelegramBot', 'Discordbot'
  ];
  const ua = userAgent.toLowerCase();
  return bots.some(bot => ua.includes(bot));
}

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
    const { categoryId, search, featured, promo, sort, page, limit, ids } = paginationQuerySchema.parse(req.query);

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (featured) where.isFeatured = true;
    if (promo) {
      where.discountPrice = { gt: 0 };
    }
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (ids) {
      where.id = { in: ids.split(',') };
    }

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
          flashSaleItems: {
            where: {
              flashSale: {
                isActive: true,
                startAt: { lte: new Date() },
                endAt: { gte: new Date() }
              }
            }
          }
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

    // Increment viewCount if unique for this IP today
    const userAgent = req.headers['user-agent'];
    const isRequesterBot = isBot(userAgent);

    if (!isRequesterBot) {
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
      const geo = geoip.lookup(ipAddress);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        // Check if exists first to avoid Prisma error logs
        const existing = await prisma.uniqueActivity.findFirst({
          where: {
            ipAddress,
            type: 'PRODUCT_VIEW',
            targetId: product.id,
            date: today
          }
        });

        if (!existing) {
          await prisma.uniqueActivity.create({
            data: {
              ipAddress,
              type: 'PRODUCT_VIEW',
              targetId: product.id,
              date: today,
              city: geo?.city,
              region: geo?.region,
              country: geo?.country
            }
          });
          
          // If create succeeds, it's unique for today
          await prisma.product.update({
            where: { id: product.id },
            data: { viewCount: { increment: 1 } }
          });
        }
      } catch (err: any) {
        if (err.code !== 'P2002') {
          console.error('Failed to record unique product view:', err);
        }
      }
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

    // If user is logged in, check their flash sale usage for this specific flash sale item
    let userFlashSaleUsage = 0;
    if ((req as AuthRequest).userId && product.flashSaleItems && product.flashSaleItems.length > 0) {
      const fsItem = product.flashSaleItems[0];
      const usage = await prisma.orderItem.aggregate({
        where: {
          productId: product.id,
          order: {
            userId: (req as AuthRequest).userId,
            createdAt: { gte: fsItem.flashSale.startAt, lte: fsItem.flashSale.endAt },
            orderStatus: { notIn: ['CANCELLED', 'PROBLEM'] }
          }
        },
        _sum: { qty: true }
      });
      userFlashSaleUsage = usage._sum.qty || 0;
    }

    res.json({
      ...product,
      categoryName: product.category?.name ?? '',
      category: undefined,
      populatedRelatedProducts: populatedRelated,
      populatedSimilarProducts: populatedSimilar,
      userFlashSaleUsage,
    });
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
                flashSaleItems: {
                  where: {
                    flashSale: {
                      isActive: true,
                      startAt: { lte: new Date() },
                      endAt: { gte: new Date() }
                    }
                  }
                }
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

// POST /api/visit
export async function recordVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const userAgent = req.headers['user-agent'];
    if (isBot(userAgent)) {
      return res.json({ success: true, message: 'Bot ignored' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const geo = geoip.lookup(ipAddress);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await prisma.uniqueActivity.create({
        data: {
          ipAddress,
          type: 'VISIT',
          date: today,
          city: geo?.city,
          region: geo?.region,
          country: geo?.country
        }
      });

      // If unique today, increment site analytics
      await prisma.siteAnalytics.upsert({
        where: { date: today },
        update: { visitorCount: { increment: 1 } },
        create: { date: today, visitorCount: 1 }
      });

      // Increment location aggregate
      if (geo?.city && geo?.region) {
        await prisma.siteAnalyticsLocation.upsert({
          where: {
            date_city_region: {
              date: today,
              city: geo.city,
              region: geo.region
            }
          },
          update: { count: { increment: 1 } },
          create: {
            date: today,
            city: geo.city,
            region: geo.region,
            count: 1
          }
        });
      }
    } catch (err: any) {
      if (err.code !== 'P2002') {
        console.error('Failed to record unique site visit:', err);
      }
    }

    res.json({ success: true });
  } catch (err) { next(err); }
}

// GET /api/products/:id/reviews
export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);
    const productIdOrSlug = req.params.id;
    
    // Find product first to get ID if slug is provided
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(productIdOrSlug);
    const product = await prisma.product.findUnique({
      where: isUuid ? { id: productIdOrSlug } : { slug: productIdOrSlug },
      select: { id: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId: product.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productReview.count({
        where: { productId: product.id, isActive: true }
      })
    ]);

    res.json({
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
}

// POST /api/products/:id/reviews
import { processAndUploadImages } from '../middleware/upload';
import xss from 'xss';
import { emitToAdmins } from '../websocket';

export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const productIdOrSlug = req.params.id;
    const { userName, rating, comment } = req.body;

    if (!userName || !rating) {
      return res.status(400).json({ message: 'Nama dan Rating wajib diisi' });
    }

    const ratingInt = parseInt(rating, 10);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ message: 'Rating harus antara 1 sampai 5' });
    }

    // Anti-spam text sanitization
    const sanitizedComment = comment ? xss(comment) : null;
    const sanitizedUserName = xss(userName);

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(productIdOrSlug);
    const product = await prisma.product.findUnique({
      where: isUuid ? { id: productIdOrSlug } : { slug: productIdOrSlug },
      select: { id: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Process images if any
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageUrls = await processAndUploadImages(req.files, 'reviews');
    }

    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        userName: sanitizedUserName,
        rating: ratingInt,
        comment: sanitizedComment,
        images: imageUrls,
        isActive: false // Default to false (requires admin approval)
      }
    });

    // Emit to admins for real-time badge update
    emitToAdmins('review:new', { 
      id: review.id, 
      userName: review.userName, 
      rating: review.rating 
    });

    res.status(201).json({
      success: true,
      message: 'Ulasan berhasil dikirim dan sedang menunggu persetujuan admin.',
      data: review
    });
  } catch (err) { next(err); }
}

export async function getWhatsAppSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await prisma.appSetting.findFirst({
      where: { key: 'admin_wa' }
    });
    res.json({ whatsapp: setting?.value || '6285961462361' });
  } catch (err) { next(err); }
}
