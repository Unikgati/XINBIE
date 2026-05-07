import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateOrderCode } from '../utils/helpers';
import { coreApi } from '../config/midtrans';
import { emitToAdmins } from '../websocket';

// POST /api/orders
export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      addressId, items, deliveryType, deliverySlotId, scheduledDate,
      promoCode, notes,
    } = req.body;
    let { paymentMethod } = req.body;
    if (paymentMethod) paymentMethod = paymentMethod.toUpperCase();

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.userId },
      include: { user: true },
    });
    if (!address) throw new AppError('Alamat tidak ditemukan', 404);

    // Resolve region names for snapshot
    const [provinceName, cityName, districtName, villageName] = await Promise.all([
      address.provinceId ? prisma.province.findUnique({ where: { id: address.provinceId }, select: { name: true } }) : null,
      address.cityId ? prisma.city.findUnique({ where: { id: address.cityId }, select: { name: true } }) : null,
      address.districtId ? prisma.district.findUnique({ where: { id: address.districtId }, select: { name: true } }) : null,
      address.villageId ? prisma.village.findUnique({ where: { id: address.villageId }, select: { name: true } }) : null,
    ]);

    // Validate user has WhatsApp number
    const user = (address as any).user;
    if (!user?.phoneWa) {
      throw new AppError('Nomor WhatsApp wajib diisi sebelum membuat pesanan. Silakan lengkapi profil Anda.', 400);
    }

    // Validate products + calculate price
    const productIds = items.map((i: any) => i.productId);
    const now = new Date();

    // Fetch products AND active flash sale items for these products
    const [products, activeFlashSales] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { variants: true },
      }),
      prisma.flashSaleItem.findMany({
        where: {
          productId: { in: productIds },
          flashSale: {
            startAt: { lte: now },
            endAt: { gte: now },
            isActive: true
          }
        },
        include: { flashSale: true }
      })
    ]);

    let subtotal = 0;
    const orderItems: any[] = [];
    const itemsDetail: { productId: string; categoryId: string; price: number; qty: number }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new AppError(`Produk ${item.productId} tidak tersedia`, 400);

      // Check for Active Flash Sale for this item
      const fsItem = activeFlashSales.find(fs => fs.productId === product.id);
      let unitPrice = (product.discountPrice || product.price);
      let isFlashSale = false;

      if (fsItem) {
        // Validation 1: Promo Stock
        const remainingFsStock = fsItem.flashStock - fsItem.soldQty;
        if (remainingFsStock < item.qty) {
          throw new AppError(`Stok Flash Sale untuk ${product.name} tidak cukup (Tersedia: ${remainingFsStock})`, 400);
        }

        // Validation 2: User Limit
        if (fsItem.limitPerUser > 0) {
          const userBoughtQty = await prisma.orderItem.aggregate({
            where: {
              productId: product.id,
              order: {
                userId: req.userId,
                createdAt: { gte: fsItem.flashSale.startAt, lte: fsItem.flashSale.endAt },
                orderStatus: { notIn: ['CANCELLED', 'PROBLEM'] }
              }
            },
            _sum: { qty: true }
          });
          
          const currentBought = userBoughtQty._sum.qty || 0;
          if (currentBought + item.qty > fsItem.limitPerUser) {
            throw new AppError(`Anda sudah mencapai batas pembelian Flash Sale untuk ${product.name} (Batas: ${fsItem.limitPerUser})`, 400);
          }
        }

        unitPrice = fsItem.flashPrice;
        isFlashSale = true;
      }

      // Stock check: Always respect main product stockQty
      if (product.stockQty < item.qty) {
        throw new AppError(`Stok ${product.name} tidak cukup (Tersedia: ${product.stockQty})`, 400);
      }

      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : null;

      // Variants currently don't combine with Flash Sale in this logic (FS is for main product)
      if (!isFlashSale) {
        unitPrice += (variant?.priceAddition || 0);
      }
      
      const totalPrice = unitPrice * item.qty;
      subtotal += totalPrice;

      orderItems.push({
        productId: product.id,
        variantId: variant?.id || null,
        isFlashSale,
        flashSaleItemId: fsItem?.id || null,
        productSnapshot: {
          name: product.name,
          price: product.price,
          discountPrice: isFlashSale ? unitPrice : product.discountPrice,
          unit: product.unit,
          image: product.images[0] || null,
          variantName: variant?.name || null,
          isFlashSale
        },
        qty: item.qty,
        unitPrice,
        totalPrice,
      });

      itemsDetail.push({
        productId: product.id,
        categoryId: product.categoryId,
        price: unitPrice,
        qty: item.qty
      });
    }

    // Delivery fee
    const deliveryFee = deliveryType === 'INSTANT' ? 10000 : 5000; // TODO: calculate from area

    const code = generateOrderCode();
    const initialStatus = paymentMethod === 'COD' ? 'RECEIVED' : 'WAITING_PAYMENT';

    // Pre-calculate promo discount (read-only, no writes yet)
    let discountAmount = 0;
    let promoId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ 
        where: { code: promoCode.toUpperCase() },
        include: { categories: true, products: true }
      });
      if (!promo || !promo.isActive) throw new AppError('Kode promo tidak valid atau sudah tidak aktif', 400);
      
      const now = new Date();
      if (promo.startAt && now < promo.startAt) throw new AppError('Kode promo belum dapat digunakan', 400);
      if (promo.endAt && now > promo.endAt) throw new AppError('Kode promo sudah kadaluarsa', 400);

      if (promo.totalUsageLimit > 0 && promo.usedCount >= promo.totalUsageLimit) throw new AppError('Kuota kode promo sudah habis', 400);
      
      // Payment Method check
      if (promo.allowedPaymentMethods && promo.allowedPaymentMethods.length > 0) {
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

      // Category & Product Scope check
      let eligibleSubtotal = subtotal;
      const hasScope = promo.categories.length > 0 || promo.products.length > 0;
      if (hasScope) {
        eligibleSubtotal = 0;
        // itemsDetail was fetched earlier at line 61
        for (const item of itemsDetail) {
          const isProductEligible = promo.products.some(p => p.id === item.productId);
          const isCategoryEligible = promo.categories.some(c => c.id === item.categoryId);
          if (isProductEligible || isCategoryEligible) {
            eligibleSubtotal += item.price * item.qty;
          }
        }
        if (eligibleSubtotal === 0) throw new AppError('Voucher tidak dapat digunakan untuk produk di keranjang Anda', 400);
      }

      if (eligibleSubtotal < promo.minOrder) {
        if (hasScope) throw new AppError(`Total produk yang memenuhi syarat belum mencapai Rp ${promo.minOrder}`, 400);
        throw new AppError(`Minimal belanja Rp ${promo.minOrder} untuk promo ini`, 400);
      }

      // Per-user limit check
      if (promo.perUserLimit > 0) {
        const usageCount = await prisma.promoUsage.count({
          where: { promoCodeId: promo.id, userId: req.userId }
        });
        if (usageCount >= promo.perUserLimit) throw new AppError('Anda sudah mencapai batas penggunaan promo ini', 400);
      }

      if (promo.type === 'PERCENT') {
        discountAmount = Math.floor((eligibleSubtotal * promo.value) / 100);
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) discountAmount = promo.maxDiscount;
      } else {
        discountAmount = promo.value;
      }
      
      if (discountAmount > eligibleSubtotal) discountAmount = eligibleSubtotal;
      promoId = promo.id;
    }

    const grandTotal = subtotal + deliveryFee - discountAmount;

    // ── Midtrans: charge BEFORE DB write ──
    // If this fails, nothing is written to DB → no ghost orders.
    let chargeResponse: any = null;
    if (paymentMethod !== 'COD') {
      let payment_type = 'bank_transfer';
      let additionalParams: any = {};

      switch (paymentMethod) {
        case 'QRIS':
        case 'GOPAY':
          payment_type = 'gopay';
          break;
        case 'SHOPEEPAY':
          payment_type = 'shopeepay';
          additionalParams.shopeepay = { callback_url: 'https://dapurgizi.com' };
          break;
        case 'OVO':
        case 'DANA':
          payment_type = 'qris';
          break;
        case 'VA':
        case 'VA_BCA':
          payment_type = 'bank_transfer';
          additionalParams.bank_transfer = { bank: 'bca' };
          break;
        case 'VA_MANDIRI':
          payment_type = 'echannel';
          additionalParams.echannel = { bill_info1: 'Pembayaran', bill_info2: 'Pesanan' };
          break;
        case 'VA_BNI':
          payment_type = 'bank_transfer';
          additionalParams.bank_transfer = { bank: 'bni' };
          break;
        case 'VA_BRI':
          payment_type = 'bank_transfer';
          additionalParams.bank_transfer = { bank: 'bri' };
          break;
        case 'VA_PERMATA':
          payment_type = 'bank_transfer';
          additionalParams.bank_transfer = { bank: 'permata' };
          break;
        case 'VA_CIMB':
          payment_type = 'bank_transfer';
          additionalParams.bank_transfer = { bank: 'cimb' };
          break;
        case 'ALFAMART':
          payment_type = 'cstore';
          additionalParams.cstore = { store: 'alfamart', message: 'Dapurgizi' };
          break;
        case 'INDOMARET':
          payment_type = 'cstore';
          additionalParams.cstore = { store: 'indomaret', message: 'Dapurgizi' };
          break;
        default:
          payment_type = 'bank_transfer';
          additionalParams.bank_transfer = { bank: 'bca' };
      }

      // Use order code as Midtrans order_id (unique, human-readable)
      const parameter: any = {
        payment_type,
        transaction_details: {
          order_id: code,
          gross_amount: grandTotal,
        },
        customer_details: {
          first_name: address.recipientName,
          email: address.user?.email || 'user@dapurgizi.com',
          phone: address.phoneWa,
        },
        ...additionalParams
      };

      try {
        chargeResponse = await coreApi.charge(parameter);
      } catch (error) {
        console.error('Midtrans charge failed:', error);
        throw new AppError('Gagal membuat transaksi pembayaran. Silakan coba lagi.', 502);
      }
    }

    // ── DB Transaction: only runs if Midtrans succeeded (or COD) ──
    // If DB fails after Midtrans charge, cancel the Midtrans transaction.
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        // Re-validate promo atomically (in case concurrent usage)
        if (promoId && promoCode) {
          const promo = await tx.promoCode.findUnique({ 
            where: { code: promoCode.toUpperCase() },
            include: { categories: true, products: true }
          });
          if (!promo || !promo.isActive) throw new AppError('Kode promo tidak valid atau sudah tidak aktif', 400);
          
          const now = new Date();
          if (promo.startAt && now < promo.startAt) throw new AppError('Kode promo belum dapat digunakan', 400);
          if (promo.endAt && now > promo.endAt) throw new AppError('Kode promo sudah kadaluarsa', 400);

          if (promo.totalUsageLimit > 0 && promo.usedCount >= promo.totalUsageLimit) throw new AppError('Kuota kode promo sudah habis', 400);
          
          if (paymentMethod === 'COD' && !promo.allowCod) {
            throw new AppError('Kode promo ini hanya berlaku untuk pembayaran non-tunai (Transfer/E-Wallet)', 400);
          }
          
          // Atomic scope re-check
          const hasScope = promo.categories.length > 0 || promo.products.length > 0;
          if (hasScope) {
            const isEligible = itemsDetail.some((item: any) => 
              promo.products.some(p => p.id === item.productId) || 
              promo.categories.some(c => c.id === item.categoryId)
            );
            if (!isEligible) throw new AppError('Voucher tidak dapat digunakan untuk produk di keranjang Anda', 400);
          }

          if (promo.perUserLimit > 0) {
            const usageCount = await tx.promoUsage.count({
              where: { promoCodeId: promo.id, userId: req.userId }
            });
            if (usageCount >= promo.perUserLimit) throw new AppError('Anda sudah mencapai batas penggunaan promo ini', 400);
          }
        }

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
              province: provinceName?.name,
              city: cityName?.name,
              district: districtName?.name,
              village: villageName?.name,
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
            ...(chargeResponse ? {
              paymentDetails: chargeResponse,
              midtransTransactionId: chargeResponse.transaction_id,
              midtransPaymentType: chargeResponse.payment_type,
            } : {}),
          },
          include: { items: true },
        });

        // Status log
        await tx.orderStatusLog.create({
          data: { orderId: newOrder.id, status: initialStatus, actorId: req.userId },
        });

        // Re-validate stock and decrement atomically (Handle Variant vs Main Product)
        for (const item of items) {
          if (item.variantId) {
            // Case: Product has Variant
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              include: { product: true }
            });

            if (!variant || !variant.isActive) {
              throw new AppError(`Varian produk ${item.name} tidak tersedia`, 400);
            }

            if (variant.stockQty < item.qty) {
              throw new AppError(`Stok varian ${variant.name} tidak cukup (Tersedia: ${variant.stockQty})`, 400);
            }

            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stockQty: { decrement: item.qty } },
            });
          } else {
            // Case: Main Product (No Variant)
            const product = await tx.product.findUnique({
              where: { id: item.productId }
            });

            if (!product || !product.isActive) {
              throw new AppError(`Produk ${item.name} tidak tersedia`, 400);
            }

            if (product.stockQty < item.qty) {
              throw new AppError(`Stok ${product.name} tidak cukup (Tersedia: ${product.stockQty})`, 400);
            }

            await tx.product.update({
              where: { id: product.id },
              data: { stockQty: { decrement: item.qty } },
            });

            // FLASH SALE ATOMIC UPDATE
            const orderItem = newOrder.items.find((oi: any) => oi.productId === item.productId && oi.isFlashSale);
            if (orderItem && orderItem.flashSaleItemId) {
              await tx.flashSaleItem.update({
                where: { id: orderItem.flashSaleItemId },
                data: { soldQty: { increment: item.qty } }
              });
            }
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
    } catch (dbError) {
      // DB failed after Midtrans charge succeeded → cancel Midtrans to prevent orphan payment
      if (chargeResponse) {
        try {
          await coreApi.transaction.cancel(code);
          console.warn(`[Midtrans] Cancelled charge for ${code} due to DB failure`);
        } catch (cancelErr) {
          console.error(`[CRITICAL] Midtrans charge ${code} succeeded but DB failed AND cancel failed. Manual refund needed.`, cancelErr);
        }
      }
      throw dbError;
    }

    // Notify admins via WebSocket (after everything succeeded)
    emitToAdmins('order:new', {
      id: order.id,
      code: order.code,
      customerName: (address.user as any)?.name || 'Pelanggan',
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    });

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
      where: { id: req.params.id as string, userId: req.userId! },
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
      where: { id: req.params.id as string, userId: req.userId! },
      include: { items: true },
    });

    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    if (!['WAITING_PAYMENT', 'RECEIVED'].includes(order.orderStatus)) {
      throw new AppError('Pesanan tidak bisa dibatalkan', 400);
    }

    const queries: any[] = [];

    queries.push(
      prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: 'CANCELLED' },
      })
    );

    queries.push(
      prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          note: req.body.reason || 'Dibatalkan oleh user',
          actorId: req.userId,
        },
      })
    );

    // Kembalikan stok barang
    for (const item of order.items) {
      if (item.variantId) {
        queries.push(
          prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { increment: item.qty } },
          })
        );
      } else if (item.productId) {
        queries.push(
          prisma.product.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.qty } },
          })
        );
      }
    }

    // Kembalikan kuota promo
    const promoUsage = await prisma.promoUsage.findFirst({ where: { orderId: order.id } });
    if (promoUsage) {
      queries.push(
        prisma.promoCode.update({
          where: { id: promoUsage.promoCodeId },
          data: { usedCount: { decrement: 1 } },
        })
      );
      queries.push(
        prisma.promoUsage.delete({ where: { id: promoUsage.id } })
      );
    }

    // Eksekusi seluruh operasi ke database secara aman (Atomic Transaction)
    await prisma.$transaction(queries);

    // Batalkan tagihan di sisi Midtrans jika masih waiting payment dan ada ID transaksinya
    if (order.midtransTransactionId && order.orderStatus === 'WAITING_PAYMENT') {
      try {
        // Use order.code as Midtrans order_id (consistent with charge)
        await coreApi.transaction.cancel(order.code);
      } catch (midtransError: any) {
        // Abaikan error midtrans (misal karena transaksinya sudah expired) agar tidak merusak flow batal di sisi kita
        console.warn(`[Midtrans] Failed to cancel order ${order.code}:`, midtransError.message);
      }
    }

    res.json({ message: 'Pesanan dibatalkan' });
  } catch (err) { next(err); }
}
