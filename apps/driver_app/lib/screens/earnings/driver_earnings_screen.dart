import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class DriverEarningsScreen extends StatelessWidget {
  const DriverEarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Penghasilan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Total earnings card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(20)),
              child: Column(
                children: [
                  Text('Total Bulan Ini', style: AppTypography.bodyMedium.copyWith(color: AppColors.textOnPrimary.withValues(alpha: 0.8))),
                  const SizedBox(height: 8),
                  Text('Rp 1.250.000', style: AppTypography.h1.copyWith(color: AppColors.textOnPrimary, fontSize: 32)),
                  const SizedBox(height: 8),
                  Text('50 pesanan selesai', style: AppTypography.bodySmall.copyWith(color: AppColors.textOnPrimary.withValues(alpha: 0.8))),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick stats
            Row(children: [
              _MiniStat('Hari Ini', 'Rp 45.000', '3 order'),
              const SizedBox(width: 12),
              _MiniStat('Minggu Ini', 'Rp 320.000', '15 order'),
            ]),
            const SizedBox(height: 24),

            // Transaction history
            Align(alignment: Alignment.centerLeft, child: Text('Riwayat Transaksi', style: AppTypography.h4)),
            const SizedBox(height: 12),

            ...List.generate(7, (i) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.receipt_long, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('DG-26041${9 - i}-${1000 + i}', style: AppTypography.labelLarge),
                  Text('${19 - i} Apr 2026', style: AppTypography.caption.copyWith(color: AppColors.textHint)),
                ])),
                Text('+Rp ${5 + i}.000', style: AppTypography.labelLarge.copyWith(color: AppColors.priceActive)),
              ]),
            )),
          ],
        ),
      ),
    );
  }
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
