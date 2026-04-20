import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateOrderCode } from '../utils/helpers';

// POST /api/orders
export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      addressId, items, deliveryType, deliverySlotId, scheduledDate,
      paymentMethod, promoCode, notes,
    } = req.body;

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.userId },
    });
    if (!address) throw new AppError('Alamat tidak ditemukan', 404);

    // Validate products + calculate price
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { variants: true },
    });

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new AppError(`Produk ${item.productId} tidak tersedia`, 400);

      // Stock check
      if (!product.isUnlimitedStock && product.stockQty < item.qty) {
        throw new AppError(`Stok ${product.name} tidak cukup`, 400);
      }

      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : null;

      const unitPrice = (product.discountPrice || product.price) + (variant?.priceAddition || 0);
      const totalPrice = unitPrice * item.qty;
      subtotal += totalPrice;

      orderItems.push({
        productId: product.id,
        variantId: variant?.id || null,
        productSnapshot: {
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          unit: product.unit,
          image: product.images[0] || null,
          variantName: variant?.name || null,
        },
        qty: item.qty,
        unitPrice,
        totalPrice,
      });
    }

    // Delivery fee
    const deliveryFee = deliveryType === 'INSTANT' ? 10000 : 5000; // TODO: calculate from area

    // Promo discount
    let discountAmount = 0;
    let promoId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
      if (promo && promo.isActive) {
        if (promo.type === 'PERCENT') {
          discountAmount = Math.floor((subtotal * promo.value) / 100);
          if (promo.maxDiscount && discountAmount > promo.maxDiscount) discountAmount = promo.maxDiscount;
        } else {
          discountAmount = promo.value;
        }
        promoId = promo.id;
      }
    }

    const grandTotal = subtotal + deliveryFee - discountAmount;
    const code = generateOrderCode();
    const initialStatus = paymentMethod === 'COD' ? 'RECEIVED' : 'WAITING_PAYMENT';

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code,
          userId: req.userId!,
          addressSnapshot: {
            recipientName: address.recipientName,
            phoneWa: address.phoneWa,
            lat: address.lat,
            lng: address.lng,
            fullAddress: address.fullAddress,
            notes: address.notes,
          },
          deliveryType: deliveryType || 'REGULAR',
          deliverySlotId: deliverySlotId || null,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
          orderStatus: initialStatus,
          subtotal,
          deliveryFee,
          discountAmount,
          grandTotal,
          notes,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Status log
      await tx.orderStatusLog.create({
        data: { orderId: newOrder.id, status: initialStatus, actorId: req.userId },
      });

      // Decrement stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product && !product.isUnlimitedStock) {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQty: { decrement: item.qty } },
          });
        }
      }

      // Record promo usage
      if (promoId) {
        await tx.promoUsage.create({
          data: { promoCodeId: promoId, userId: req.userId!, orderId: newOrder.id },
        });
        await tx.promoCode.update({
          where: { id: promoId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // TODO: Send notification to admin
    // TODO: Create Midtrans transaction if not COD

    res.status(201).json(order);
  } catch (err) { next(err); }
}

// GET /api/orders
export async function getOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = { userId: req.userId };
    if (status === 'active') {
      where.orderStatus = { in: ['WAITING_PAYMENT', 'RECEIVED', 'PROCESSING', 'WAITING_DRIVER', 'IN_DELIVERY'] };
    } else if (status === 'history') {
      where.orderStatus = { in: ['DELIVERED', 'COMPLETED', 'CANCELLED', 'PROBLEM'] };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: {
          items: true,
          driver: { select: { name: true, phoneWa: true, avatarUrl: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders.map((o) => ({
        ...o,
        driverName: o.driver?.name,
        driverPhoneWa: o.driver?.phoneWa,
        driver: undefined,
      })),
      meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) },
    });
  } catch (err) { next(err); }
}

// GET /api/orders/:id
export async function getOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        items: true,
        driver: { select: { name: true, phoneWa: true, avatarUrl: true } },
        statusLogs: { orderBy: { createdAt: 'asc' } },
        pickupPoint: true,
      },
    });

    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    res.json(order);
  } catch (err) { next(err); }
}

// PUT /api/orders/:id/cancel
export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    if (!['WAITING_PAYMENT', 'RECEIVED'].includes(order.orderStatus)) {
      throw new AppError('Pesanan tidak bisa dibatalkan', 400);
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: 'CANCELLED' },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          note: 'Dibatalkan oleh user',
          actorId: req.userId,
        },
      }),
    ]);

    // TODO: Restore stock, refund if paid

    res.json({ message: 'Pesanan dibatalkan' });
  } catch (err) { next(err); }
}
