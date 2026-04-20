import prisma from '../config/database';

/**
 * Commission calculation helper — production-ready with edge case handling.
 */

interface CommissionSettings {
  type: 'FIXED' | 'PERCENT' | 'HYBRID';
  fixed: number;
  percent: number;
  bonusPerKm: number;
  minWithdrawal: number;
  maxWithdrawalDay: number;
}

// Default commission settings
const DEFAULTS: CommissionSettings = {
  type: 'HYBRID',
  fixed: 5000,
  percent: 80,
  bonusPerKm: 1500,
  minWithdrawal: 50000,
  maxWithdrawalDay: 1,
};

export async function getCommissionSettings(): Promise<CommissionSettings> {
  const keys = [
    'driver_commission_type',
    'driver_commission_fixed',
    'driver_commission_percent',
    'driver_bonus_per_km',
    'driver_min_withdrawal',
    'driver_max_withdrawal_day',
  ];

  const settings = await prisma.appSetting.findMany({
    where: { key: { in: keys } },
  });

  const map = new Map(settings.map(s => [s.key, s.value]));

  return {
    type: (map.get('driver_commission_type') as CommissionSettings['type']) || DEFAULTS.type,
    fixed: parseInt(map.get('driver_commission_fixed') || String(DEFAULTS.fixed)),
    percent: parseInt(map.get('driver_commission_percent') || String(DEFAULTS.percent)),
    bonusPerKm: parseInt(map.get('driver_bonus_per_km') || String(DEFAULTS.bonusPerKm)),
    minWithdrawal: parseInt(map.get('driver_min_withdrawal') || String(DEFAULTS.minWithdrawal)),
    maxWithdrawalDay: parseInt(map.get('driver_max_withdrawal_day') || String(DEFAULTS.maxWithdrawalDay)),
  };
}

/**
 * Calculate commission amount for an order.
 */
export function calculateCommission(
  settings: CommissionSettings,
  deliveryFee: number,
  _distanceKm?: number
): number {
  let commission = 0;

  switch (settings.type) {
    case 'FIXED':
      commission = settings.fixed;
      break;
    case 'PERCENT':
      commission = Math.round(deliveryFee * settings.percent / 100);
      break;
    case 'HYBRID':
      commission = settings.fixed + Math.round(deliveryFee * settings.percent / 100);
      break;
  }

  // Bonus per KM — TODO: calculate actual distance when GPS tracking implemented
  // if (distanceKm && settings.bonusPerKm > 0) {
  //   commission += Math.round(distanceKm * settings.bonusPerKm);
  // }

  return commission;
}

/**
 * Create commission for a delivered order — idempotent (safe to call multiple times).
 */
export async function createCommission(orderId: string, driverId: string) {
  // Idempotent check — prevent double commission
  const existing = await prisma.driverTransaction.findFirst({
    where: { orderId, type: 'COMMISSION' },
  });
  if (existing) return existing;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const settings = await getCommissionSettings();
  const commission = calculateCommission(settings, order.deliveryFee);

  if (commission <= 0) return null; // No commission to give

  // Upsert wallet + create transaction atomically
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.driverWallet.upsert({
      where: { userId: driverId },
      create: { userId: driverId, balance: commission },
      update: { balance: { increment: commission } },
    });

    const transaction = await tx.driverTransaction.create({
      data: {
        walletId: wallet.id,
        orderId,
        type: 'COMMISSION',
        amount: commission,
        balance: wallet.balance,
        note: `Komisi order ${order.code}`,
      },
    });

    return transaction;
  });
}

/**
 * Handle COD settlement — deduct the order total from driver wallet.
 * Driver collected cash, must hand it over to platform.
 */
export async function createCodSettlement(orderId: string, driverId: string) {
  const existing = await prisma.driverTransaction.findFirst({
    where: { orderId, type: 'COD_SETTLEMENT' },
  });
  if (existing) return existing;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Only apply for COD orders
  if (order.paymentMethod !== 'COD') return null;

  const deduction = -order.grandTotal; // Negative = money owed to platform

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.driverWallet.upsert({
      where: { userId: driverId },
      create: { userId: driverId, balance: deduction },
      update: { balance: { decrement: order.grandTotal } },
    });

    return tx.driverTransaction.create({
      data: {
        walletId: wallet.id,
        orderId,
        type: 'COD_SETTLEMENT',
        amount: deduction,
        balance: wallet.balance,
        note: `Setoran COD order ${order.code} — Rp ${order.grandTotal.toLocaleString('id-ID')}`,
      },
    });
  });
}

/**
 * Reverse commission — when order cancelled/refunded after delivery.
 */
export async function reverseCommission(orderId: string) {
  const original = await prisma.driverTransaction.findFirst({
    where: { orderId, type: 'COMMISSION' },
  });
  if (!original) return null;

  // Check if already reversed
  const existingPenalty = await prisma.driverTransaction.findFirst({
    where: { orderId, type: 'PENALTY' },
  });
  if (existingPenalty) return existingPenalty;

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.driverWallet.update({
      where: { id: original.walletId },
      data: { balance: { decrement: original.amount } },
    });

    return tx.driverTransaction.create({
      data: {
        walletId: original.walletId,
        orderId,
        type: 'PENALTY',
        amount: -original.amount,
        balance: wallet.balance,
        note: `Reversal: order ${orderId} dibatalkan/refund`,
      },
    });
  });
}
