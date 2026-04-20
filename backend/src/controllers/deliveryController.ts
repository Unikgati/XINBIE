import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// GET /api/delivery/slots
export async function getSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const dayOfWeek = date ? new Date(date as string).getDay() : new Date().getDay();

    const slots = await prisma.deliverySlot.findMany({
      where: { isActive: true, dayOfWeek },
      orderBy: { startTime: 'asc' },
    });

    // Check exceptions
    if (date) {
      const exception = await prisma.deliveryException.findFirst({
        where: { date: new Date(date as string) },
      });
      if (exception?.isClosed) {
        return res.json({ slots: [], exception: exception.reason });
      }
    }

    // Count current orders per slot
    const slotsWithCount = await Promise.all(
      slots.map(async (slot) => {
        const orderCount = await prisma.order.count({
          where: {
            deliverySlotId: slot.id,
            scheduledDate: date ? new Date(date as string) : undefined,
            orderStatus: { notIn: ['CANCELLED'] },
          },
        });
        return { ...slot, currentOrders: orderCount, isFull: orderCount >= slot.maxOrders };
      })
    );

    res.json({ slots: slotsWithCount });
  } catch (err) { next(err); }
}

// GET /api/delivery/options
export async function getOptions(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng } = req.query;

    const areas = await prisma.deliveryArea.findMany({ where: { isActive: true } });

    // Find matching area by distance
    let deliveryFee = 0;
    let isInArea = false;

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);

      for (const area of areas) {
        const dist = haversineDistance(userLat, userLng, area.lat, area.lng);
        if (dist <= area.radiusKm) {
          deliveryFee = area.fee;
          isInArea = true;
          break;
        }
      }
    }

    res.json({
      isInArea,
      deliveryFee,
      options: [
        { type: 'REGULAR', label: 'Regular (Terjadwal)', available: true },
        { type: 'INSTANT', label: 'Instant (Sekarang)', available: isInArea },
      ],
    });
  } catch (err) { next(err); }
}

// POST /api/promo/validate
export async function validatePromo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, subtotal } = req.body;

    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.isActive) throw new AppError('Kode promo tidak valid', 404);

    const now = new Date();
    if (promo.startAt && now < promo.startAt) throw new AppError('Promo belum dimulai', 400);
    if (promo.endAt && now > promo.endAt) throw new AppError('Promo sudah berakhir', 400);
    if (subtotal < promo.minOrder) {
      throw new AppError(`Minimum order Rp ${promo.minOrder.toLocaleString('id-ID')}`, 400);
    }
    if (promo.totalUsageLimit > 0 && promo.usedCount >= promo.totalUsageLimit) {
      throw new AppError('Kuota promo sudah habis', 400);
    }

    // Check per-user usage
    const userUsage = await prisma.promoUsage.count({
      where: { promoCodeId: promo.id, userId: req.userId! },
    });
    if (promo.perUserLimit > 0 && userUsage >= promo.perUserLimit) {
      throw new AppError('Anda sudah menggunakan promo ini', 400);
    }

    let discount = 0;
    if (promo.type === 'PERCENT') {
      discount = Math.floor((subtotal * promo.value) / 100);
      if (promo.maxDiscount && discount > promo.maxDiscount) discount = promo.maxDiscount;
    } else {
      discount = promo.value;
    }

    res.json({
      valid: true,
      promoId: promo.id,
      type: promo.type,
      value: promo.value,
      discount,
      message: `Diskon Rp ${discount.toLocaleString('id-ID')} berhasil diterapkan`,
    });
  } catch (err) { next(err); }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
