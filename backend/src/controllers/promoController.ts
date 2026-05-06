import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// POST /api/promos/validate
export async function validatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, subtotal, paymentMethod, items } = req.body;
    if (!code) throw new AppError('Kode promo harus diisi', 400);

    const promo = await prisma.promoCode.findUnique({ 
      where: { code: code.toUpperCase() },
      include: { 
        categories: { select: { id: true, name: true } },
        products: { select: { id: true, name: true } },
      }
    });
    if (!promo) throw new AppError('Kode promo tidak ditemukan', 404);
    if (!promo.isActive) throw new AppError('Kode promo sudah tidak aktif', 400);

    // Payment Method Check
    if (promo.allowedPaymentMethods && promo.allowedPaymentMethods.length > 0) {
      if (!paymentMethod) {
        throw new AppError('Pilih metode pembayaran terlebih dahulu untuk menggunakan voucher ini', 400);
      }
      if (!promo.allowedPaymentMethods.includes(paymentMethod)) {
        const methodsLabel = promo.allowedPaymentMethods.join(', ');
        throw new AppError(`Voucher ini hanya berlaku untuk pembayaran: ${methodsLabel}`, 400);
      }
    } else {
      // Fallback to legacy COD check if allowedPaymentMethods is empty
      if (paymentMethod === 'COD' && !promo.allowCod) {
        throw new AppError('Kode promo ini hanya berlaku untuk pembayaran non-tunai (Transfer/E-Wallet)', 400);
      }
    }

    // Date check
    const now = new Date();
    if (promo.startAt && now < promo.startAt) {
      throw new AppError('Kode promo belum dapat digunakan', 400);
    }
    if (promo.endAt && now > promo.endAt) {
      throw new AppError('Kode promo sudah kadaluarsa', 400);
    }

    // Limit check
    if (promo.totalUsageLimit > 0 && promo.usedCount >= promo.totalUsageLimit) {
      throw new AppError('Kuota kode promo sudah habis', 400);
    }

    // Category & Product Scope check
    let eligibleSubtotal = subtotal || 0;
    const hasScope = promo.categories.length > 0 || promo.products.length > 0;
    
    if (hasScope && items && Array.isArray(items)) {
      // Fetch product details for items
      const productIds = items.map((i: any) => i.productId);
      const productsData = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true, price: true, discountPrice: true, variants: { select: { id: true, price: true, discountPrice: true } } }
      });

      eligibleSubtotal = 0;
      items.forEach((item: any) => {
        const p = productsData.find(pd => pd.id === item.productId);
        if (!p) return;

        const isProductEligible = promo.products.some(pp => pp.id === p.id);
        const isCategoryEligible = promo.categories.some(pc => pc.id === p.categoryId);

        if (isProductEligible || isCategoryEligible) {
          // Calculate price for this item
          let itemPrice = p.discountPrice || p.price;
          if (item.variantId) {
            const v = p.variants.find(vd => vd.id === item.variantId);
            if (v) itemPrice = v.discountPrice || v.price;
          }
          eligibleSubtotal += itemPrice * item.qty;
        }
      });

      if (eligibleSubtotal === 0) {
        let msg = 'Voucher ini hanya berlaku untuk produk tertentu';
        if (promo.categories.length > 0) msg = `Voucher ini hanya berlaku untuk kategori: ${promo.categories.map(c => c.name).join(', ')}`;
        throw new AppError(msg, 400);
      }
    }

    // Min Order check (apply to eligible items if scoped)
    if (eligibleSubtotal < promo.minOrder) {
      if (hasScope) {
        throw new AppError(`Total produk yang memenuhi syarat belum mencapai Rp ${promo.minOrder}`, 400);
      }
      throw new AppError(`Minimal belanja Rp ${promo.minOrder} untuk menggunakan promo ini`, 400);
    }

    // User Limit check
    if (promo.perUserLimit > 0) {
      const userUsage = await prisma.promoUsage.count({
        where: {
          promoCodeId: promo.id,
          userId: req.userId,
        },
      });
      if (userUsage >= promo.perUserLimit) {
        throw new AppError(`Anda sudah melewati batas maksimal penggunaan promo ini`, 400);
      }
    }

    // Calculate discount based on eligible subtotal
    let discountAmount = 0;
    if (promo.type === 'PERCENT') {
      discountAmount = Math.floor((eligibleSubtotal * promo.value) / 100);
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount;
      }
    } else {
      discountAmount = promo.value;
    }

    // Ensure discount doesn't exceed eligible subtotal
    if (discountAmount > eligibleSubtotal) discountAmount = eligibleSubtotal;

    res.json({
      isValid: true,
      message: 'Kode promo berhasil digunakan',
      discountAmount,
      type: promo.type,
      code: promo.code,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/promos/available
export async function getAvailablePromos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const promos = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        OR: [
          { startAt: null },
          { startAt: { lte: now } }
        ],
        AND: [
          { OR: [
            { endAt: null },
            { endAt: { gte: now } }
          ] }
        ]
      },
      include: { categories: true, products: true },
      orderBy: { createdAt: 'desc' }
    });

    // Filter by usage limits (we could do this in SQL but it's easier to check perUserLimit here)
    const filteredPromos = [];
    for (const p of promos) {
      // Check total limit
      if (p.totalUsageLimit > 0 && p.usedCount >= p.totalUsageLimit) continue;
      
      // Check per user limit
      if (p.perUserLimit > 0) {
        const usage = await prisma.promoUsage.count({
          where: { promoCodeId: p.id, userId: req.userId }
        });
        if (usage >= p.perUserLimit) continue;
      }
      
      filteredPromos.push(p);
    }

    res.json(filteredPromos);
  } catch (err) {
    next(err);
  }
}
