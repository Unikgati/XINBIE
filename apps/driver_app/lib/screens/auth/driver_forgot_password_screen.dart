import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:core/utils/validators.dart';

class DriverForgotPasswordScreen extends ConsumerStatefulWidget {
  const DriverForgotPasswordScreen({super.key});

  @override
  ConsumerState<DriverForgotPasswordScreen> createState() => _DriverForgotPasswordScreenState();
}

class _DriverForgotPasswordScreenState extends ConsumerState<DriverForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
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
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Lupa Password', style: AppTypography.h2),
              const SizedBox(height: 8),
              Text(
                'Masukkan email kamu dan kami akan mengirimkan kode OTP untuk mereset password',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 32),

              Text('Email', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'contoh@email.com',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 32),

              DgButton(
                label: 'Kirim OTP',
                isLoading: _loading,
                onPressed: () async {
                  if (Validators.email(_emailCtrl.text) != null) return;
                  setState(() => _loading = true);

                  try {
                    await ref.read(authRepositoryProvider).forgotPassword(email: _emailCtrl.text.trim());
                    if (mounted) {
                      DgSnackbar.showSuccess(context, message: 'OTP telah dikirim ke email kamu');
                      context.push('/otp?email=${_emailCtrl.text.trim()}&type=password_reset');
                    }
                  } catch (e) {
                    if (mounted) {
                      DgSnackbar.showError(context, message: 'Gagal mengirim OTP', error: e);
                    }
                  } finally {
                    if (mounted) {
                      setState(() => _loading = false);
                    }
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
