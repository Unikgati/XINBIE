import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/utils/validators.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
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
                onPressed: () {
                  if (Validators.email(_emailCtrl.text) != null) return;
                  setState(() => _loading = true);
                  Future.delayed(const Duration(seconds: 1), () {
                    if (mounted) {
                      setState(() => _loading = false);
                      context.push('/otp?email=${_emailCtrl.text}&type=password_reset');
                    }
                  });
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
