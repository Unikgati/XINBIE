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
      extendBody: true, // Content flows behind the floating nav bar
      body: child,
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primaryAction, // Light Green background
            borderRadius: BorderRadius.circular(40),
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryAction.withOpacity(0.3),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _FloatingNavItem(
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'Beranda',
                isActive: i == 0,
                onTap: () => context.go('/home'),
              ),
              _FloatingNavItem(
                icon: Icons.history_outlined,
                activeIcon: Icons.history,
                label: 'Riwayat',
                isActive: i == 1,
                onTap: () => context.go('/history'),
              ),
              _FloatingNavItem(
                icon: Icons.account_balance_wallet_outlined,
                activeIcon: Icons.account_balance_wallet,
                label: 'Penghasilan',
                isActive: i == 2,
                onTap: () => context.go('/earnings'),
              ),
              _FloatingNavItem(
                icon: Icons.person_outlined,
                activeIcon: Icons.person,
                label: 'Profil',
                isActive: i == 3,
                onTap: () => context.go('/profile'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingNavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _FloatingNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: const BoxDecoration(
          color: Colors.transparent,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              color: Colors.white,
              size: 24,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTypography.caption.copyWith(
                color: Colors.white,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
