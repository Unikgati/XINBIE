import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/utils/validators.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});
  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true, _loading = false;

  @override
  void dispose() { _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 40),
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 72, height: 72,
                        decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(20)),
                        child: const Icon(Icons.delivery_dining, size: 40, color: AppColors.primary),
                      ),
                      const SizedBox(height: 16),
                      Text('Login Driver', style: AppTypography.h2),
                      const SizedBox(height: 4),
                      Text('Masuk untuk mulai menerima pesanan', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const SizedBox(height: 40),

                Text('Email', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                  decoration: const InputDecoration(hintText: 'contoh@email.com', prefixIcon: Icon(Icons.email_outlined)),
                ),
                const SizedBox(height: 20),

                Text('Password', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  validator: (v) => v == null || v.isEmpty ? 'Password wajib diisi' : null,
                  decoration: InputDecoration(
                    hintText: 'Masukkan password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                DgButton(label: 'Masuk', isLoading: _loading, onPressed: () {
                  if (!_formKey.currentState!.validate()) return;
                  setState(() => _loading = true);
                  Future.delayed(const Duration(seconds: 1), () {
                    if (mounted) { setState(() => _loading = false); context.go('/home'); }
                  });
                }),
                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Belum jadi driver? ', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                    GestureDetector(
                      onTap: () => context.push('/register'),
                      child: Text('Daftar', style: AppTypography.labelLarge.copyWith(color: AppColors.primary)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
