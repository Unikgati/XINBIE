import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class VerificationPendingScreen extends StatelessWidget {
  const VerificationPendingScreen({super.key});

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
                'Data kamu sedang diverifikasi oleh tim kami. Proses ini biasanya memakan waktu 1x24 jam.',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16)),
                child: Column(
                  children: [
                    _InfoRow(Icons.check_circle, 'Akun dibuat', AppColors.primary),
                    _InfoRow(Icons.check_circle, 'KTP diupload', AppColors.primary),
                    _InfoRow(Icons.hourglass_top, 'Verifikasi admin', AppColors.warning),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Kami akan mengirim notifikasi setelah akun kamu diverifikasi',
                style: AppTypography.bodySmall.copyWith(color: AppColors.textHint),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.label, this.color);
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(width: 12),
        Text(label, style: AppTypography.bodyMedium),
      ]),
    );
  }
}
