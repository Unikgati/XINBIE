import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class KtpUploadScreen extends ConsumerStatefulWidget {
  const KtpUploadScreen({super.key});
  @override
  ConsumerState<KtpUploadScreen> createState() => _KtpUploadScreenState();
}

class _KtpUploadScreenState extends ConsumerState<KtpUploadScreen> {
  File? _image;
  bool _loading = false;
  String? _rejectionReason;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadRejectionReason();
  }

  Future<void> _loadRejectionReason() async {
    try {
      final repo = ref.read(driverRepositoryProvider);
      final status = await repo.getVerificationStatus();
      if (mounted && status['rejectionReason'] != null) {
        setState(() => _rejectionReason = status['rejectionReason'] as String);
      }
    } catch (_) {}
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 1200,
      imageQuality: 85,
    );
    if (picked != null && mounted) {
      setState(() => _image = File(picked.path));
    }
  }



  Future<void> _upload() async {
    if (_image == null) return;
    setState(() => _loading = true);

    try {
      final repo = ref.read(driverRepositoryProvider);
      await repo.uploadKtp(_image!.path);
      if (mounted) {
        DgSnackbar.showSuccess(context, message: 'KTP berhasil diupload!');
        context.go('/verification-pending');
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal upload KTP', error: e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

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
            Text(
              'Pastikan foto jelas dan tidak terpotong',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
            ),

            if (_rejectionReason != null) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, size: 20, color: AppColors.error),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Pendaftaran ditolak',
                            style: AppTypography.labelLarge.copyWith(
                              color: AppColors.error,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _rejectionReason!,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.error,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 32),

            GestureDetector(
              onTap: () => _pickImage(ImageSource.camera),
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _image != null ? AppColors.primary : AppColors.border,
                    width: 2,
                  ),
                ),
                child: _image != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.file(_image!, fit: BoxFit.cover),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.camera_alt, size: 48, color: AppColors.textHint),
                          const SizedBox(height: 8),
                          Text(
                            'Tap untuk foto KTP',
                            style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
              ),
            ),

            if (_image != null) ...[
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: () => _pickImage(ImageSource.camera),
                icon: const Icon(Icons.refresh, size: 16, color: AppColors.primary),
                label: Text('Ganti Foto', style: AppTypography.labelSmall.copyWith(color: AppColors.primary)),
              ),
            ],

            const Spacer(),

            DgButton(
              label: 'Upload KTP',
              isLoading: _loading,
              onPressed: _image != null ? _upload : null,
            ),
          ],
        ),
      ),
    );
  }
}
