import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class DriverHomeShell extends StatelessWidget {
  const DriverHomeShell({super.key, required this.child});
  final Widget child;

  int _index(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    if (loc.startsWith('/history')) return 1;
    if (loc.startsWith('/earnings')) return 2;
    if (loc.startsWith('/profile')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final i = _index(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: AppColors.surface, boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 12, offset: const Offset(0, -2))]),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(Icons.home_outlined, Icons.home, 'Beranda', i == 0, () => context.go('/home')),
                _NavItem(Icons.history_outlined, Icons.history, 'Riwayat', i == 1, () => context.go('/history')),
                _NavItem(Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, 'Penghasilan', i == 2, () => context.go('/earnings')),
                _NavItem(Icons.person_outlined, Icons.person, 'Profil', i == 3, () => context.go('/profile')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem(this.icon, this.activeIcon, this.label, this.isActive, this.onTap);
  final IconData icon, activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap, behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(isActive ? activeIcon : icon, color: isActive ? AppColors.primary : AppColors.textSecondary, size: 24),
          const SizedBox(height: 2),
          Text(label, style: AppTypography.caption.copyWith(color: isActive ? AppColors.primary : AppColors.textSecondary, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, fontSize: 11)),
        ]),
      ),
    );
  }
}
