import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Profile header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                color: AppColors.surface,
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: AppColors.primarySurface,
                      child: Text('TS', style: AppTypography.h2.copyWith(color: AppColors.primary)),
                    ),
                    const SizedBox(height: 12),
                    Text('Test User', style: AppTypography.h3),
                    Text('user@example.com', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Menu items
              _MenuSection(children: [
                _MenuItem(icon: Icons.location_on_outlined, label: 'Alamat Saya', onTap: () => context.push('/addresses')),
                _MenuItem(icon: Icons.notifications_outlined, label: 'Notifikasi', onTap: () => context.push('/notifications')),
              ]),
              const SizedBox(height: 8),

              _MenuSection(children: [
                _MenuItem(icon: Icons.help_outline, label: 'Bantuan', onTap: () {}),
                _MenuItem(icon: Icons.info_outline, label: 'Tentang Aplikasi', onTap: () {}),
                _MenuItem(icon: Icons.star_outline, label: 'Beri Rating', onTap: () {}),
              ]),
              const SizedBox(height: 8),

              _MenuSection(children: [
                _MenuItem(
                  icon: Icons.logout,
                  label: 'Keluar',
                  color: AppColors.error,
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Keluar'),
                        content: const Text('Yakin ingin keluar dari akun?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
                          TextButton(
                            onPressed: () { Navigator.pop(context); context.go('/login'); },
                            child: Text('Keluar', style: TextStyle(color: AppColors.error)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ]),
              const SizedBox(height: 16),

              Text('Dapur Gizi v1.0.0', style: AppTypography.caption.copyWith(color: AppColors.textHint)),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  const _MenuSection({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      child: Column(children: children),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({required this.icon, required this.label, required this.onTap, this.color});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color ?? AppColors.textPrimary, size: 22),
      title: Text(label, style: AppTypography.bodyMedium.copyWith(color: color)),
      trailing: Icon(Icons.chevron_right, color: AppColors.textHint, size: 20),
      onTap: onTap,
    );
  }
}
