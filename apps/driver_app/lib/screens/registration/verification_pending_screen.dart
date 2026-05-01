import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class VerificationPendingScreen extends ConsumerStatefulWidget {
  const VerificationPendingScreen({super.key});

  @override
  ConsumerState<VerificationPendingScreen> createState() => _VerificationPendingScreenState();
}

class _VerificationPendingScreenState extends ConsumerState<VerificationPendingScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _timer = Timer.periodic(const Duration(seconds: 10), (_) async {
      if (!mounted) return;
      try {
        final repo = ref.read(driverRepositoryProvider);
        final statusData = await repo.getVerificationStatus();
        if (!mounted) return;

        final status = statusData['status'];
        if (status == 'APPROVED' || status == 'REJECTED') {
          _timer?.cancel();
          await ref.read(driverAuthNotifierProvider.notifier).checkAuthStatus();
          if (!mounted) return;
          
          if (status == 'APPROVED') {
            context.go('/home');
          } else if (status == 'REJECTED') {
            context.go('/upload-ktp');
          }
        }
      } catch (e) {
        // Silently ignore poll errors, might be temporary network issue
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(color: AppColors.primarySurface, shape: BoxShape.circle),
                child: const Icon(Icons.hourglass_top, size: 56, color: AppColors.primary),
              ),
              const SizedBox(height: 32),
              Text('Menunggu Verifikasi', style: AppTypography.h2, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text(
                'Data kamu sedang diverifikasi oleh tim kami. Aplikasi akan otomatis dialihkan jika sudah disetujui.',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}


