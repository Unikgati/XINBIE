import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { processAndUploadImage, processAndUploadImages } from '../middleware/upload';

// ═══════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers, totalDrivers, totalProducts,
      todayOrders, monthOrders, monthRevenue,
      pendingDrivers, activeOrders, recentOrders,
      monthCogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.driverProfile.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: thisMonth }, paymentStatus: 'PAID' },
        _sum: { grandTotal: true },
      }),
      prisma.driverProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: { in: ['RECEIVED', 'PROCESSING', 'WAITING_DRIVER', 'IN_DELIVERY'] } } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      // Calculate COGS: sum(orderItem.qty * product.costPrice) for paid orders this month
      prisma.orderItem.findMany({
        where: {
          order: { createdAt: { gte: thisMonth }, paymentStatus: 'PAID' },
          product: { isNot: null },
        },
        select: { qty: true, product: { select: { costPrice: true } } },
      }),
    ]);

    const revenue = monthRevenue._sum.grandTotal || 0;
    const cogs = monthCogs.reduce((sum, item) => sum + (item.qty * (item.product?.costPrice || 0)), 0);
    const grossProfit = revenue - cogs;
    const marginPercent = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

    res.json({
      stats: {
        totalUsers, totalDrivers, totalProducts,
        todayOrders, monthOrders,
        monthRevenue: revenue,
        monthCogs: cogs,
        grossProfit,
        marginPercent,
        pendingDrivers, activeOrders,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id, code: o.code, userName: o.user.name,
        grandTotal: o.grandTotal, orderStatus: o.orderStatus,
        createdAt: o.createdAt,
      })),
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
          category: { select: { name: true } },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ data: products, meta: { total, page: parseInt(page as string) } });
  } catch (err) { next(err); }
}

export async function adminCreateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = await processAndUploadImages(req.files, 'products');
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        images,
        price: parseInt(req.body.price),
        costPrice: req.body.costPrice ? parseInt(req.body.costPrice) : 0,
      },
    });

    res.status(201).json(product);
  } catch (err) { next(err); }
}

export async function adminUpdateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let images: string[] | undefined;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      images = await processAndUploadImages(req.files, 'products');
    }

    const data: any = { ...req.body };
    if (images) data.images = images;
    if (data.price) data.price = parseInt(data.price);
    if (data.costPrice) data.costPrice = parseInt(data.costPrice);
    if (data.discountPrice) data.discountPrice = parseInt(data.discountPrice);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });

    res.json(product);
  } catch (err) { next(err); }
}

export async function adminDeleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Produk dinonaktifkan' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Product Variants CRUD
// ═══════════════════════════════════════

export async function adminGetVariants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId: req.params.productId },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(variants);
  } catch (err) { next(err); }
}

export async function adminCreateVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let imageUrl: string | undefined;
    if (req.file) imageUrl = await processAndUploadImage(req.file, 'variants');

    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.productId,
        name: req.body.name,
        sku: req.body.sku || null,
        price: parseInt(req.body.price) || 0,
        costPrice: parseInt(req.body.costPrice) || 0,
        priceAddition: parseInt(req.body.priceAddition) || 0,
        stockQty: parseInt(req.body.stockQty) || 0,
        imageUrl,
        sortOrder: parseInt(req.body.sortOrder) || 0,
      },
    });
    res.status(201).json(variant);
  } catch (err) { next(err); }
}

export async function adminUpdateVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data: any = { ...req.body };
    if (req.file) data.imageUrl = await processAndUploadImage(req.file, 'variants');
    if (data.price) data.price = parseInt(data.price);
    if (data.costPrice) data.costPrice = parseInt(data.costPrice);
    if (data.priceAddition) data.priceAddition = parseInt(data.priceAddition);
    if (data.stockQty) data.stockQty = parseInt(data.stockQty);
    if (data.sortOrder) data.sortOrder = parseInt(data.sortOrder);

    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data,
    });
    res.json(variant);
  } catch (err) { next(err); }
}

export async function adminDeleteVariant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.productVariant.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Varian dinonaktifkan' });
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

export async function adminCreateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let iconUrl: string | undefined;
    if (req.file) iconUrl = await processAndUploadImage(req.file, 'categories');

    const category = await prisma.category.create({
      data: { ...req.body, iconUrl },
    });
    res.status(201).json(category);
  } catch (err) { next(err); }
}

export async function adminUpdateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let iconUrl: string | undefined;
    if (req.file) iconUrl = await processAndUploadImage(req.file, 'categories');

    const data: any = { ...req.body };
    if (iconUrl) data.iconUrl = iconUrl;

    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(category);
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Orders
// ═══════════════════════════════════════

export async function adminGetOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '20', search } = req.query;
    const where: any = {};
    if (status) where.orderStatus = status;
    if (search) where.code = { contains: search as string, mode: 'insensitive' };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, phoneWa: true } },
          driver: { select: { name: true, phoneWa: true } },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ data: orders, meta: { total, page: parseInt(page as string) } });
  } catch (err) { next(err); }
}

export async function adminUpdateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, note, driverId, pickupPointId } = req.body;
    const data: any = { orderStatus: status };
    if (driverId) data.driverId = driverId;
    if (pickupPointId) data.pickupPointId = pickupPointId;

    await prisma.$transaction([
      prisma.order.update({ where: { id: req.params.id }, data }),
      prisma.orderStatusLog.create({
        data: { orderId: req.params.id, status, actorId: req.userId, note: note || 'Admin update' },
      }),
    ]);

    res.json({ message: 'Status pesanan diperbarui' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Drivers
// ═══════════════════════════════════════

export async function adminGetDrivers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.verificationStatus = status;

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

export async function adminVerifyDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, rejectionReason } = req.body;

    await prisma.driverProfile.update({
      where: { id: req.params.id },
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
    const { page = '1', limit = '20', search } = req.query;
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
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });

    res.json({ message: user.isActive ? 'User dinonaktifkan' : 'User diaktifkan' });
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

    const banner = await prisma.banner.create({
      data: { ...req.body, imageUrl },
    });
    res.status(201).json(banner);
  } catch (err) { next(err); }
}

export async function adminUpdateBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data: any = { ...req.body };
    if (req.file) data.imageUrl = await processAndUploadImage(req.file, 'banners', 1200, 90);

    const banner = await prisma.banner.update({ where: { id: req.params.id }, data });
    res.json(banner);
  } catch (err) { next(err); }
}

export async function adminDeleteBanner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Banner dihapus' });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Promos CRUD
// ═══════════════════════════════════════

export async function adminGetPromos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(promos);
  } catch (err) { next(err); }
}

export async function adminCreatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const promo = await prisma.promoCode.create({ data: req.body });
    res.status(201).json(promo);
  } catch (err) { next(err); }
}

export async function adminUpdatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const promo = await prisma.promoCode.update({ where: { id: req.params.id }, data: req.body });
    res.json(promo);
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

export async function adminBroadcast(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, body, target } = req.body; // target: 'all_users' | 'all_drivers'

    const where: any = {};
    if (target === 'all_users') where.role = 'USER';
    else if (target === 'all_drivers') where.role = 'DRIVER';

    const users = await prisma.user.findMany({ where, select: { id: true } });

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        body,
        type: 'broadcast',
      })),
    });

    // TODO: Send FCM to topic

    res.json({ message: `Broadcast terkirim ke ${users.length} user` });
  } catch (err) { next(err); }
}

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
          phone: t.wallet.user.phone,
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
      where: { id },
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
      where: { id },
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
    const { id } = req.params;

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
    const totalCommission = transactions.filter(t => t.type === 'COMMISSION').reduce((s, t) => s + t.amount, 0);
    const totalWithdrawn = transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED').reduce((s, t) => s + Math.abs(t.amount), 0);
    const pendingWithdrawals = transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING').reduce((s, t) => s + Math.abs(t.amount), 0);

    res.json({
      driver: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        ...user.driverProfile,
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
        where: { userId: id },
        create: { userId: id, balance: adjustedAmount },
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
