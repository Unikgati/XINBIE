import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { processAndUploadImage } from '../middleware/upload';
import { createCommission, createCodSettlement, getCommissionSettings } from '../utils/commission';

// POST /api/driver/register
export async function registerDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.driverProfile.findUnique({
      where: { userId: req.userId! },
    });
    if (existing) throw new AppError('Anda sudah terdaftar sebagai driver', 409);

    const profile = await prisma.driverProfile.create({
      data: { userId: req.userId! },
    });

    // Update user role
    await prisma.user.update({
      where: { id: req.userId },
      data: { role: 'DRIVER' },
    });

    res.status(201).json(profile);
  } catch (err) { next(err); }
}

// POST /api/driver/upload-ktp
export async function uploadKtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('File KTP wajib diupload', 400);

    const url = await processAndUploadImage(req.file, 'ktp', 1200);

    await prisma.driverProfile.update({
      where: { userId: req.userId! },
      data: { ktpPhotoUrl: url, verificationStatus: 'PENDING' },
    });

    res.json({ ktpPhotoUrl: url, message: 'KTP berhasil diupload. Menunggu verifikasi.' });
  } catch (err) { next(err); }
}

// GET /api/driver/verification-status
export async function getVerificationStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: req.userId! },
    });
    if (!profile) throw new AppError('Profil driver tidak ditemukan', 404);

    res.json({
      status: profile.verificationStatus,
      rejectionReason: profile.rejectionReason,
    });
  } catch (err) { next(err); }
}

// PUT /api/driver/online-status
export async function toggleOnline(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { isOnline } = req.body;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: req.userId! },
    });
    if (!profile) throw new AppError('Profil driver tidak ditemukan', 404);
    if (profile.verificationStatus !== 'APPROVED') {
      throw new AppError('Akun belum diverifikasi', 403);
    }

    await prisma.driverProfile.update({
      where: { userId: req.userId! },
      data: { isOnline },
    });

    res.json({ isOnline, message: isOnline ? 'Anda sekarang online' : 'Anda offline' });
  } catch (err) { next(err); }
}

// PUT /api/driver/location
export async function updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { lat, lng } = req.body;

    await prisma.driverProfile.update({
      where: { userId: req.userId! },
      data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
    });

    res.json({ message: 'Lokasi diperbarui' });
  } catch (err) { next(err); }
}

// GET /api/driver/orders/active
export async function getActiveOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        driverId: req.userId,
        orderStatus: { in: ['WAITING_DRIVER', 'IN_DELIVERY'] },
      },
      include: { items: true, pickupPoint: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err) { next(err); }
}

// GET /api/driver/orders/history
export async function getOrderHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          driverId: req.userId,
          orderStatus: { in: ['DELIVERED', 'COMPLETED', 'PROBLEM'] },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: { items: true },
      }),
      prisma.order.count({
        where: { driverId: req.userId, orderStatus: { in: ['DELIVERED', 'COMPLETED', 'PROBLEM'] } },
      }),
    ]);

    res.json({ data: orders, meta: { total, page: parseInt(page as string) } });
  } catch (err) { next(err); }
}

// PUT /api/driver/orders/:id/accept
export async function acceptOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    if (order.orderStatus !== 'WAITING_DRIVER') throw new AppError('Pesanan sudah diambil', 400);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { driverId: req.userId, orderStatus: 'IN_DELIVERY' },
      }),
      prisma.orderStatusLog.create({
        data: { orderId: order.id, status: 'IN_DELIVERY', actorId: req.userId, note: 'Driver menerima pesanan' },
      }),
    ]);

    res.json({ message: 'Pesanan diterima' });
  } catch (err) { next(err); }
}

// PUT /api/driver/orders/:id/status
export async function updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, note } = req.body;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, driverId: req.userId },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: status },
      }),
      prisma.orderStatusLog.create({
        data: { orderId: order.id, status, actorId: req.userId, note },
      }),
    ]);

    if (status === 'DELIVERED') {
      await prisma.driverProfile.update({
        where: { userId: req.userId! },
        data: { totalOrdersDone: { increment: 1 } },
      });

      // Auto-create commission + COD settlement
      try {
        await createCommission(order.id, req.userId!);
        await createCodSettlement(order.id, req.userId!);
      } catch (err) {
        console.error('Commission creation failed:', err);
        // Don't fail the status update if commission fails
      }
    }

    res.json({ message: 'Status diperbarui' });
  } catch (err) { next(err); }
}

// POST /api/driver/orders/:id/proof
export async function uploadProof(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('Foto bukti wajib diupload', 400);

    const url = await processAndUploadImage(req.file, 'proofs');

    await prisma.order.update({
      where: { id: req.params.id },
      data: { proofPhotoUrl: url },
    });

    res.json({ proofPhotoUrl: url });
  } catch (err) { next(err); }
}

// POST /api/driver/orders/:id/problem
export async function reportProblem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, description } = req.body;
    let photoUrl: string | undefined;

    if (req.file) {
      photoUrl = await processAndUploadImage(req.file, 'problems');
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: req.params.id },
        data: {
          orderStatus: 'PROBLEM',
          problemType: type,
          problemDescription: description,
          problemPhotoUrl: photoUrl,
        },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: req.params.id,
          status: 'PROBLEM',
          actorId: req.userId,
          note: `${type}: ${description}`,
        },
      }),
    ]);

    res.json({ message: 'Masalah dilaporkan' });
  } catch (err) { next(err); }
}

// POST /api/driver/orders/:id/cod-confirm
export async function confirmCod(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.order.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'PAID' },
    });
    res.json({ message: 'Pembayaran COD dikonfirmasi' });
  } catch (err) { next(err); }
}

// GET /api/driver/earnings
export async function getEarnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const wallet = await prisma.driverWallet.findUnique({
      where: { userId: req.userId! },
    });

    if (!wallet) {
      return res.json({ balance: 0, totalEarnings: 0, totalOrders: 0, transactions: [] });
    }

    // Get commission transactions
    const commissions = await prisma.driverTransaction.findMany({
      where: { walletId: wallet.id, type: 'COMMISSION' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalEarnings = commissions.reduce((sum, t) => sum + t.amount, 0);

    // Today's earnings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCommissions = commissions.filter(t => t.createdAt >= todayStart);
    const todayEarnings = todayCommissions.reduce((sum, t) => sum + t.amount, 0);

    // This week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekCommissions = commissions.filter(t => t.createdAt >= weekStart);
    const weekEarnings = weekCommissions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      balance: wallet.balance,
      totalEarnings,
      todayEarnings,
      todayOrders: todayCommissions.length,
      weekEarnings,
      weekOrders: weekCommissions.length,
      totalOrders: commissions.length,
      transactions: commissions,
    });
  } catch (err) { next(err); }
}

// GET /api/driver/wallet
export async function getWallet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const wallet = await prisma.driverWallet.findUnique({
      where: { userId: req.userId! },
    });

    if (!wallet) {
      return res.json({ balance: 0, transactions: [] });
    }

    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.driverTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.driverTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    res.json({
      balance: wallet.balance,
      transactions,
      meta: { total, page: parseInt(page as string) },
    });
  } catch (err) { next(err); }
}

// POST /api/driver/withdrawal
export async function requestWithdrawal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) throw new AppError('Jumlah tidak valid', 400);

    const settings = await getCommissionSettings();

    if (amount < settings.minWithdrawal) {
      throw new AppError(`Minimum penarikan Rp ${settings.minWithdrawal.toLocaleString('id-ID')}`, 400);
    }

    // Check bank info
    const profile = await prisma.driverProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile?.bankName || !profile?.accountNumber) {
      throw new AppError('Lengkapi data rekening terlebih dahulu', 400);
    }

    // Atomic withdrawal with balance check
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.driverWallet.findUnique({ where: { userId: req.userId! } });
      if (!wallet) throw new AppError('Wallet tidak ditemukan', 404);
      if (wallet.balance < amount) throw new AppError('Saldo tidak cukup', 400);

      // Max per day check (WIB = UTC+7)
      const todayStart = new Date();
      todayStart.setHours(todayStart.getHours() >= 7 ? -17 : -41, 0, 0, 0); // Approximate WIB
      const todayWithdrawals = await tx.driverTransaction.count({
        where: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          createdAt: { gte: todayStart },
        },
      });
      if (todayWithdrawals >= settings.maxWithdrawalDay) {
        throw new AppError(`Maksimal ${settings.maxWithdrawalDay}x penarikan per hari`, 400);
      }

      // Deduct balance immediately
      const updatedWallet = await tx.driverWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.driverTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: -amount,
          balance: updatedWallet.balance,
          status: 'PENDING',
          note: `Penarikan ke ${profile.bankName} ${profile.accountNumber} a/n ${profile.accountHolder}`,
        },
      });

      return { transaction, newBalance: updatedWallet.balance };
    });

    res.status(201).json({
      message: 'Permintaan penarikan berhasil diajukan',
      ...result,
    });
  } catch (err) { next(err); }
}

// GET /api/driver/bank
export async function getBankInfo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: req.userId! },
      select: { bankName: true, accountNumber: true, accountHolder: true, vehicleType: true, vehiclePlate: true },
    });
    if (!profile) throw new AppError('Profil driver tidak ditemukan', 404);
    res.json(profile);
  } catch (err) { next(err); }
}

// PUT /api/driver/bank
export async function updateBankInfo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bankName, accountNumber, accountHolder, vehicleType, vehiclePlate } = req.body;

    const profile = await prisma.driverProfile.update({
      where: { userId: req.userId! },
      data: {
        ...(bankName !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(accountHolder !== undefined && { accountHolder }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(vehiclePlate !== undefined && { vehiclePlate }),
      },
    });

    res.json({ message: 'Data rekening diperbarui', profile });
  } catch (err) { next(err); }
}
