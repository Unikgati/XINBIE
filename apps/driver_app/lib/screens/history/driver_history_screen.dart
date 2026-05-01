import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class DriverHistoryScreen extends ConsumerWidget {
  const DriverHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncHistory = ref.watch(driverOrderHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Riwayat Pesanan')),
      body: asyncHistory.when(
        loading: () => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          itemBuilder: (_, __) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  DgShimmer(width: 120, height: 14, borderRadius: 6),
                  DgShimmer(width: 80, height: 22, borderRadius: 12),
                ]),
                const SizedBox(height: 12),
                DgShimmer(width: 160, height: 12, borderRadius: 6),
                const SizedBox(height: 6),
                DgShimmer(width: 100, height: 12, borderRadius: 6),
              ]),
            ),
          ),
        ),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 8),
            Text('Gagal memuat: $e', style: AppTypography.bodySmall),
            const SizedBox(height: 8),
            DgButton(label: 'Coba Lagi', isOutlined: true, onPressed: () => ref.invalidate(driverOrderHistoryProvider)),
          ]),
        ),
        data: (orders) {
          if (orders.isEmpty) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.history, size: 64, color: AppColors.textHint),
                const SizedBox(height: 12),
                Text('Belum ada riwayat', style: AppTypography.h4.copyWith(color: AppColors.textSecondary)),
                Text('Pesanan selesai akan muncul di sini', style: AppTypography.bodySmall.copyWith(color: AppColors.textHint)),
              ]),
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(driverOrderHistoryProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final o = orders[i];
                final code = o['code'] as String? ?? '';
                final statusStr = o['orderStatus'] as String? ?? '';
                final items = o['items'] as List? ?? [];
                final grandTotal = o['grandTotal'] as int? ?? 0;
                final deliveryFee = o['deliveryFee'] as int? ?? 0;
                final createdAt = DateTime.tryParse(o['createdAt'] as String? ?? '') ?? DateTime.now();

                OrderStatus status;
                switch (statusStr) {
                  case 'DELIVERED': status = OrderStatus.delivered;
                  case 'COMPLETED': status = OrderStatus.completed;
                  case 'PROBLEM': status = OrderStatus.problem;
                  default: status = OrderStatus.completed;
                }

                return GestureDetector(
                  onTap: () => context.push('/order/${o['id']}'),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(code, style: AppTypography.labelLarge),
                          DgStatusBadge(status: status),
                        ]),
                        const SizedBox(height: 8),
                        Text(
                          '${items.length} item • Rp ${grandTotal.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}',
                          style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(
                            DateFormatter.date(createdAt),
                            style: AppTypography.caption.copyWith(color: AppColors.textHint),
                          ),
                          Text(
                            'Ongkir: Rp ${deliveryFee.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}',
                            style: AppTypography.labelSmall.copyWith(color: AppColors.priceActive),
                          ),
                        ]),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
