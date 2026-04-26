import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// POST /api/promos/validate
export async function validatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, subtotal } = req.body;
    if (!code) throw new AppError('Kode promo harus diisi', 400);

    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo) throw new AppError('Kode promo tidak ditemukan', 404);
    if (!promo.isActive) throw new AppError('Kode promo sudah tidak aktif', 400);

    // Limit check
    if (promo.totalUsageLimit > 0 && promo.usedCount >= promo.totalUsageLimit) {
      throw new AppError('Kuota kode promo sudah habis', 400);
    }

    // Min Order check
    if (subtotal && subtotal < promo.minOrder) {
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

    // Calculate discount
    let discountAmount = 0;
    if (subtotal) {
      if (promo.type === 'PERCENT') {
        discountAmount = Math.floor((subtotal * promo.value) / 100);
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
          discountAmount = promo.maxDiscount;
        }
      } else {
        discountAmount = promo.value;
      }
    }

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
