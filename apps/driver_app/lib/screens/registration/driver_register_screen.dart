import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class DriverRegisterScreen extends StatelessWidget {
  const DriverRegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Daftar Driver')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mau jadi driver?', style: AppTypography.h2),
            const SizedBox(height: 8),
            Text('Lengkapi data berikut untuk mendaftar sebagai driver Dapur Gizi', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 32),

            // Steps
            _StepItem(number: '1', title: 'Buat Akun', desc: 'Daftar menggunakan email', done: true),
            _StepItem(number: '2', title: 'Upload KTP', desc: 'Foto KTP untuk verifikasi identitas', done: false),
            _StepItem(number: '3', title: 'Verifikasi', desc: 'Tim kami akan memverifikasi data kamu', done: false),
            _StepItem(number: '4', title: 'Mulai Antar', desc: 'Terima pesanan dan mulai penghasilan', done: false),
            const SizedBox(height: 32),

            DgButton(label: 'Lanjut Upload KTP', onPressed: () => context.push('/upload-ktp')),
          ],
        ),
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  const _StepItem({required this.number, required this.title, required this.desc, required this.done});
  final String number, title, desc;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: done ? AppColors.primary : AppColors.background,
              shape: BoxShape.circle,
            ),
            child: Center(child: done
                ? const Icon(Icons.check, color: AppColors.textOnPrimary, size: 18)
                : Text(number, style: AppTypography.labelLarge.copyWith(color: AppColors.textSecondary)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.labelLarge),
              Text(desc, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
            ],
          )),
        ],
      ),
    );
  }
}
