import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class DriverProfileScreen extends StatelessWidget {
  const DriverProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                color: AppColors.surface,
                child: Column(children: [
                  CircleAvatar(radius: 40, backgroundColor: AppColors.primarySurface, child: Text('TD', style: AppTypography.h2.copyWith(color: AppColors.primary))),
                  const SizedBox(height: 12),
                  Text('Test Driver', style: AppTypography.h3),
                  Text('driver@example.com', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.verified, color: AppColors.primary, size: 16),
                      const SizedBox(width: 4),
                      Text('Terverifikasi', style: AppTypography.labelSmall.copyWith(color: AppColors.primaryDark)),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 8),

              // Stats
              Container(
                padding: const EdgeInsets.all(16),
                color: AppColors.surface,
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _Stat('⭐', '4.8', 'Rating'),
                  Container(width: 1, height: 40, color: AppColors.border),
                  _Stat('📦', '50', 'Pesanan'),
                  Container(width: 1, height: 40, color: AppColors.border),
                  _Stat('📅', '3 bln', 'Bergabung'),
                ]),
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

              Container(
                color: AppColors.surface,
                child: _Menu(Icons.logout, 'Keluar', () {
                  context.go('/login');
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
