import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/constants/enums.dart';

class DriverHistoryScreen extends StatelessWidget {
  const DriverHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Riwayat Pesanan')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final isCompleted = i < 3;
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)]),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('DG-26041${9 - i}-${1000 + i}', style: AppTypography.labelLarge),
                  DgStatusBadge(status: isCompleted ? OrderStatus.completed : OrderStatus.problem),
                ]),
                const SizedBox(height: 8),
                Text('${3 + i} item • Rp ${(50 + i * 20)}.000', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: 4),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('${19 - i} Apr 2026', style: AppTypography.caption.copyWith(color: AppColors.textHint)),
                  Text('Ongkir: Rp ${5 + i}.000', style: AppTypography.labelSmall.copyWith(color: AppColors.priceActive)),
                ]),
              ],
            ),
          );
        },
      ),
    );
  }
}
