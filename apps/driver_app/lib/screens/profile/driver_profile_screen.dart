import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class DriverProfileScreen extends ConsumerWidget {
  const DriverProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(driverAuthNotifierProvider);
    final asyncEarnings = ref.watch(driverEarningsProvider(null));

    final user = authState.maybeWhen(
      authenticated: (u) => u,
      orElse: () => null,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                color: AppColors.surface,
                child: Column(children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.primarySurface,
                    backgroundImage: user?.avatarUrl != null
                        ? NetworkImage(AppConfig.fixImageUrl(user!.avatarUrl!))
                        : null,
                    child: user?.avatarUrl == null
                        ? Text(
                            (user?.name ?? 'D').isNotEmpty ? (user?.name ?? 'D')[0].toUpperCase() : 'D',
                            style: AppTypography.h2.copyWith(color: AppColors.primary),
                          )
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(user?.name ?? 'Driver', style: AppTypography.h3),
                  Text(user?.email ?? '', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.verified, color: AppColors.primary, size: 16),
                      const SizedBox(width: 4),
                      Text('Driver Terverifikasi', style: AppTypography.labelSmall.copyWith(color: AppColors.primaryDark)),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 8),

              // Stats
              Container(
                padding: const EdgeInsets.all(16),
                color: AppColors.surface,
                child: asyncEarnings.when(
                  data: (data) {
                    final rating = (data['rating'] as num?)?.toStringAsFixed(1) ?? '-';
                    final totalOrders = data['totalOrders'] as int? ?? 0;
                    final joinedDate = user?.createdAt;
                    final joinedStr = joinedDate != null
                        ? '${_monthsDiff(joinedDate)} bln'
                        : '-';

                    return Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                      _Stat('⭐', rating, 'Rating'),
                      Container(width: 1, height: 40, color: AppColors.border),
                      _Stat('📦', '$totalOrders', 'Pesanan'),
                      Container(width: 1, height: 40, color: AppColors.border),
                      _Stat('📅', joinedStr, 'Bergabung'),
                    ]);
                  },
                  loading: () => Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                    DgShimmer(width: 60, height: 40, borderRadius: 8),
                    DgShimmer(width: 60, height: 40, borderRadius: 8),
                    DgShimmer(width: 60, height: 40, borderRadius: 8),
                  ]),
                  error: (_, __) => const SizedBox(),
                ),
              ),
              const SizedBox(height: 8),

              // Menu
              Container(
                color: AppColors.surface,
                child: Column(children: [
                  _Menu(Icons.account_balance, 'Rekening / E-Wallet', () => context.push('/bank-account')),
                  _Menu(Icons.two_wheeler, 'Info Kendaraan', () => context.push('/bank-account')),
                  _Menu(Icons.badge, 'Data KTP', () {}),
                  _Menu(Icons.settings, 'Pengaturan', () {}),
                  _Menu(Icons.help_outline, 'Bantuan', () {}),
                  _Menu(Icons.info_outline, 'Tentang Aplikasi', () {}),
                ]),
              ),
              const SizedBox(height: 8),

              // Logout
              Container(
                color: AppColors.surface,
                child: _Menu(Icons.logout, 'Keluar', () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      title: const Text('Keluar'),
                      content: const Text('Yakin ingin keluar dari akun driver?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
                        ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                          child: const Text('Keluar'),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true) {
                    await ref.read(driverAuthNotifierProvider.notifier).logout();
                    ref.read(socketServiceProvider).disconnect();
                    if (context.mounted) context.go('/login');
                  }
                }, color: AppColors.error),
              ),
              const SizedBox(height: 16),
              Text('Dapur Gizi Driver v1.0.0', style: AppTypography.caption.copyWith(color: AppColors.textHint)),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  int _monthsDiff(DateTime from) {
    final now = DateTime.now();
    return (now.year - from.year) * 12 + now.month - from.month;
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.emoji, this.value, this.label);
  final String emoji, value, label;
  @override
  Widget build(BuildContext context) => Column(children: [
    Text(emoji, style: const TextStyle(fontSize: 20)),
    Text(value, style: AppTypography.h4),
    Text(label, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
  ]);
}

class _Menu extends StatelessWidget {
  const _Menu(this.icon, this.label, this.onTap, {this.color});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, color: color ?? AppColors.textPrimary, size: 22),
    title: Text(label, style: AppTypography.bodyMedium.copyWith(color: color)),
    trailing: Icon(Icons.chevron_right, color: AppColors.textHint, size: 20),
    onTap: onTap,
  );
}
