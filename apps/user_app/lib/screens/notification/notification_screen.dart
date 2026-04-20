import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          TextButton(
            onPressed: () {},
            child: Text('Baca Semua', style: AppTypography.bodySmall.copyWith(color: AppColors.primary)),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _mockNotifs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final n = _mockNotifs[i];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: n.isRead ? AppColors.surface : AppColors.primarySurface.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 2)],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: n.iconColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(n.icon, color: n.iconColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(n.title, style: AppTypography.labelLarge),
                      const SizedBox(height: 2),
                      Text(n.body, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary), maxLines: 2),
                      const SizedBox(height: 4),
                      Text(n.time, style: AppTypography.caption.copyWith(color: AppColors.textHint)),
                    ],
                  ),
                ),
                if (!n.isRead) Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _NotifData {
  final String title, body, time;
  final IconData icon;
  final Color iconColor;
  final bool isRead;
  const _NotifData(this.title, this.body, this.time, this.icon, this.iconColor, this.isRead);
}

final _mockNotifs = [
  const _NotifData('Pesanan Dikirim 🚀', 'Pesanan DG-260420-1234 sedang dalam perjalanan', '5 menit lalu', Icons.local_shipping, AppColors.primary, false),
  const _NotifData('Pembayaran Berhasil', 'Pembayaran Rp 88.000 untuk pesanan DG-260420-1234 berhasil', '30 menit lalu', Icons.check_circle, AppColors.success, false),
  const _NotifData('Promo Spesial! 🎉', 'Gunakan kode WELCOME10 untuk diskon 10% pesanan pertama', '2 jam lalu', Icons.local_offer, AppColors.warning, true),
  const _NotifData('Pesanan Selesai', 'Pesanan DG-260419-9999 telah selesai. Terima kasih!', 'Kemarin', Icons.check_circle_outline, AppColors.info, true),
];
