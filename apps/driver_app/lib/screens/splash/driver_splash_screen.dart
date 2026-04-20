import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class DriverSplashScreen extends StatefulWidget {
  const DriverSplashScreen({super.key});
  @override
  State<DriverSplashScreen> createState() => _DriverSplashScreenState();
}

class _DriverSplashScreenState extends State<DriverSplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..forward();
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) context.go('/login');
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.heroGradient),
        child: Center(
          child: FadeTransition(
            opacity: _ctrl,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 100, height: 100,
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(24)),
                  child: const Icon(Icons.delivery_dining, size: 56, color: AppColors.primary),
                ),
                const SizedBox(height: 24),
                Text('Dapur Gizi', style: AppTypography.h1.copyWith(color: AppColors.textOnPrimary, fontSize: 32)),
                const SizedBox(height: 4),
                Text('Driver', style: AppTypography.h3.copyWith(color: AppColors.textOnPrimary.withValues(alpha: 0.9))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
