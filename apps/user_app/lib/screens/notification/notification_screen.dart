import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/user_providers.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Notifikasi',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
        iconTheme: const IconThemeData(color: AppColors.textSecondary),
      ),
      body: authState.when(
        data: (isLoggedIn) {
          if (!isLoggedIn) {
            return Center(
              child: DgEmptyState(
                icon: Icons.notifications_off_outlined,
                title: 'Belum Masuk',
                subtitle: 'Yuk masuk atau daftar akun dulu biar tidak ketinggalan info promo dan pesananmu!',
                actionLabel: 'Masuk Sekarang',
                onAction: () => context.push('/login'),
              ),
            );
          }
          final notifsAsync = ref.watch(notificationsProvider);

          return notifsAsync.when(
            data: (notifs) {
              if (notifs.isEmpty) {
                return Center(
                  child: DgEmptyState(
                    icon: Icons.notifications_none,
                    title: 'Belum ada notifikasi',
                    subtitle: 'Yuk mulai belanja bahan dapur sehat!',
                  ),
                );
              }
              
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${notifs.length} Notifikasi',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.primaryDark,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            // TODO: implement mark all as read API call
                          },
                          child: Text(
                            'Baca Semua',
                            style: AppTypography.labelLarge.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      itemCount: notifs.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, i) {
                        final n = notifs[i];
                        
                        IconData iconData = Icons.notifications;
                        Color iconColor = AppColors.info;
                        
                        if (n.type.toUpperCase() == 'PROMO') {
                          iconData = Icons.local_offer;
                          iconColor = AppColors.warning;
                        } else if (n.type.toUpperCase() == 'ORDER_UPDATE') {
                          iconData = Icons.local_shipping;
                          iconColor = AppColors.primary;
                        } else if (n.type.toUpperCase() == 'PAYMENT') {
                          iconData = Icons.receipt;
                          iconColor = AppColors.success;
                        }
                        
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: n.isRead ? AppColors.surface : AppColors.primarySurface.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                            boxShadow: [BoxShadow(color: AppColors.shadow.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  color: iconColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(iconData, color: iconColor, size: 20),
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
                                    Text(DateFormatter.relative(n.createdAt), style: AppTypography.caption.copyWith(color: AppColors.textHint)),
                                  ],
                                ),
                              ),
                              if (!n.isRead) Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              );
            },
            loading: () => DgShimmer.notificationList(),
            error: (err, _) => Center(child: Text('Gagal memuat notifikasi: $err')),
          );
        },
        loading: () => DgShimmer.notificationList(),
        error: (err, _) => Center(child: Text('Terjadi kesalahan: $err')),
      ),
    );
  }
}
