import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:core/utils/validators.dart';

class DriverResetPasswordScreen extends ConsumerStatefulWidget {
  const DriverResetPasswordScreen({
    super.key,
    required this.email,
    required this.otp,
  });

  final String email;
  final String otp;

  @override
  ConsumerState<DriverResetPasswordScreen> createState() => _DriverResetPasswordScreenState();
}

class _DriverResetPasswordScreenState extends ConsumerState<DriverResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      await ref.read(authRepositoryProvider).resetPassword(
            email: widget.email,
            otp: widget.otp,
            newPassword: _passCtrl.text,
          );

      if (mounted) {
        DgSnackbar.showSuccess(context, message: 'Kata sandi berhasil diubah! Silakan masuk kembali.');
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal mengatur ulang kata sandi', error: e);
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Atur Ulang Sandi', style: AppTypography.h2),
                const SizedBox(height: 8),
                Text(
                  'Masukkan kata sandi baru untuk akun Anda',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 32),

                // Password
                Text('Kata Sandi Baru', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  validator: Validators.password,
                  decoration: InputDecoration(
                    hintText: 'Minimal 8 karakter',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Confirm Password
                Text('Konfirmasi Kata Sandi Baru', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmCtrl,
                  obscureText: true,
                  validator: (v) => Validators.confirmPassword(v, _passCtrl.text),
                  decoration: const InputDecoration(
                    hintText: 'Ulangi kata sandi baru',
                    prefixIcon: Icon(Icons.lock_outlined),
                  ),
                ),
                const SizedBox(height: 32),

                DgButton(
                  label: 'Simpan Kata Sandi',
                  onPressed: _resetPassword,
                  isLoading: _loading,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
