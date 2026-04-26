import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import '../../providers/driver_providers.dart';

class DriverEarningsScreen extends ConsumerWidget {
  const DriverEarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyEarnings = ref.watch(driverEarningsProvider(null));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Penghasilan')),
      body: asyEarnings.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, stack) => Center(child: Text('Gagal memuat data: $e')),
        data: (data) {
          final balance = data['balance'] as int? ?? 0;
          final todayEarnings = data['todayEarnings'] as int? ?? 0;
          final todayOrders = data['todayOrders'] as int? ?? 0;
          final weekEarnings = data['weekEarnings'] as int? ?? 0;
          final weekOrders = data['weekOrders'] as int? ?? 0;
          final totalEarnings = data['totalEarnings'] as int? ?? 0;
          final totalOrders = data['totalOrders'] as int? ?? 0;
          final transactions = (data['transactions'] as List?)?.cast<Map<String, dynamic>>() ?? [];

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
            // Balance Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(20)),
              child: Column(
                children: [
                  Text('Saldo Anda', style: AppTypography.bodyMedium.copyWith(color: AppColors.textOnPrimary.withValues(alpha: 0.8))),
                  const SizedBox(height: 8),
                  Text('Rp ${_formatCurrency(balance)}', style: AppTypography.h1.copyWith(color: AppColors.textOnPrimary, fontSize: 32)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/withdrawal'),
                      icon: const Icon(Icons.account_balance_wallet, size: 18),
                      label: const Text('Tarik Saldo'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick stats
            Row(children: [
              _MiniStat('Hari Ini', 'Rp ${_formatCurrency(todayEarnings)}', '$todayOrders order'),
              const SizedBox(width: 12),
              _MiniStat('Minggu Ini', 'Rp ${_formatCurrency(weekEarnings)}', '$weekOrders order'),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              _MiniStat('Total', 'Rp ${_formatCurrency(totalEarnings)}', '$totalOrders order'),
              const SizedBox(width: 12),
              _ActionCard('Rekening', Icons.account_balance, () => context.push('/bank-account')),
            ]),
            const SizedBox(height: 24),

              // Transaction history
              Align(alignment: Alignment.centerLeft, child: Text('Riwayat Komisi (50 Trx Terakhir)', style: AppTypography.h4)),
              const SizedBox(height: 12),

              if (transactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: Text('Belum ada transaksi')),
                )
              else
                ...transactions.map((tx) {
                  final type = tx['type'] as String? ?? 'UNKNOWN';
                  final amount = tx['amount'] as int? ?? 0;
                  final rawDate = tx['createdAt'] as String?;
                  final date = rawDate != null ? DateTime.parse(rawDate) : DateTime.now();
                  final note = tx['note'] as String? ?? 'Transaksi';

                  return _TransactionTile(
                    type: type,
                    amount: amount,
                    date: date,
                    note: note,
                  );
                }),
            ],
          ),
        );
      },
      ),
    );
  }
}

String _formatCurrency(int amount) {
  final abs = amount.abs();
  if (abs >= 1000000) return '${(abs / 1000000).toStringAsFixed(1)}jt';
  if (abs >= 1000) return '${(abs / 1000).toStringAsFixed(0)}.000';
  return abs.toString();
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.label, this.value, this.sub);
  final String label, value, sub;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 4),
          Text(value, style: AppTypography.h4.copyWith(color: AppColors.priceActive)),
          Text(sub, style: AppTypography.caption.copyWith(color: AppColors.textHint)),
        ]),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard(this.label, this.icon, this.onTap);
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(16)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 8),
            Text(label, style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
            Text('Kelola →', style: AppTypography.caption.copyWith(color: AppColors.primary)),
          ]),
        ),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.type, required this.amount, required this.date, required this.note});
  final String type;
  final int amount;
  final DateTime date;
  final String note;

  @override
  Widget build(BuildContext context) {
    final isIncome = amount > 0;
    final iconData = switch (type) {
      'COMMISSION' => Icons.receipt_long,
      'BONUS' => Icons.card_giftcard,
      'WITHDRAWAL' => Icons.account_balance,
      'PENALTY' => Icons.warning_amber,
      'COD_SETTLEMENT' => Icons.payments,
      _ => Icons.receipt,
    };
    final iconColor = switch (type) {
      'COMMISSION' => AppColors.primary,
      'BONUS' => Colors.orange,
      'WITHDRAWAL' => Colors.blue,
      'PENALTY' => Colors.red,
      'COD_SETTLEMENT' => Colors.purple,
      _ => AppColors.textSecondary,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
          child: Icon(iconData, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(note, style: AppTypography.labelLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
          Text('${date.day}/${date.month}/${date.year}', style: AppTypography.caption.copyWith(color: AppColors.textHint)),
        ])),
        Text(
          '${isIncome ? '+' : ''}Rp ${_formatCurrency(amount)}',
          style: AppTypography.labelLarge.copyWith(color: isIncome ? AppColors.priceActive : Colors.red),
        ),
      ]),
    );
  }
}
