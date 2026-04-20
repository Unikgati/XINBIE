import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class KtpUploadScreen extends StatefulWidget {
  const KtpUploadScreen({super.key});
  @override
  State<KtpUploadScreen> createState() => _KtpUploadScreenState();
}

class _KtpUploadScreenState extends State<KtpUploadScreen> {
  bool _hasImage = false;
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Upload KTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text('Foto KTP Kamu', style: AppTypography.h3),
            const SizedBox(height: 8),
            Text('Pastikan foto jelas dan tidak terpotong', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 32),

            // Upload area
            GestureDetector(
              onTap: () => setState(() => _hasImage = true),
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border, width: 2, style: BorderStyle.solid),
                ),
                child: _hasImage
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          color: AppColors.primarySurface,
                          child: const Center(child: Icon(Icons.badge, size: 80, color: AppColors.primary)),
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.camera_alt, size: 48, color: AppColors.textHint),
                          const SizedBox(height: 8),
                          Text('Tap untuk foto KTP', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                        ],
                      ),
              ),
            ),
            const Spacer(),

            DgButton(
              label: 'Upload KTP',
              isLoading: _loading,
              onPressed: _hasImage ? () {
                setState(() => _loading = true);
                Future.delayed(const Duration(seconds: 1), () {
                  if (mounted) { setState(() => _loading = false); context.go('/verification-pending'); }
                });
              } : null,
            ),
          ],
        ),
      ),
    );
  }
}
