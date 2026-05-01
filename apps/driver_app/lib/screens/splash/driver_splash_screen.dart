import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class DriverSplashScreen extends ConsumerStatefulWidget {
  const DriverSplashScreen({super.key});
  @override
  ConsumerState<DriverSplashScreen> createState() => _DriverSplashScreenState();
}

class _DriverSplashScreenState extends ConsumerState<DriverSplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _scale = Tween<double>(begin: 0.8, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    await ref.read(driverAuthNotifierProvider.notifier).checkAuthStatus();
    if (!mounted) return;

    final authState = ref.read(driverAuthNotifierProvider);
    final isAuth = authState.maybeWhen(
      authenticated: (_) => true,
      orElse: () => false,
    );

    if (isAuth) {
      try {
        final driverRepo = ref.read(driverRepositoryProvider);
        final status = await driverRepo.getVerificationStatus();
        if (!mounted) return;

        final verStatus = status['status'] as String?;
        final hasKtp = status['ktpPhotoUrl'] != null;

        if (verStatus == 'APPROVED') {
          context.go('/home');
        } else if (verStatus == 'REJECTED' || !hasKtp) {
          // No KTP uploaded yet, or rejected → upload KTP
          context.go('/upload-ktp');
        } else {
          // KTP uploaded, waiting for admin review
          context.go('/verification-pending');
        }
      } catch (e) {
        if (mounted) context.go('/register');
      }
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: AppColors.onboardingGradient,
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeIn,
            child: ScaleTransition(
              scale: _scale,
              child: SvgPicture.asset(
                'assets/images/logo.svg',
                width: 200,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
