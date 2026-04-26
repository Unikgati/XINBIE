import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:core/utils/validators.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    
    try {
      await ref.read(authRepositoryProvider).register(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      
      if (mounted) {
        final redirect = GoRouterState.of(context).uri.queryParameters['redirect'];
        final redirectParam = redirect != null ? '&redirect=${Uri.encodeComponent(redirect)}' : '';
        context.push('/otp?email=${_emailCtrl.text.trim()}&type=verification$redirectParam');
      }
    } catch (e) {
      if (mounted) {
        String errMsg = 'Terjadi kesalahan, silakan coba lagi.';
        if (e.toString().contains('DioException') || e is ApiException) {
          if (e.toString().contains('timeout')) {
            errMsg = 'Koneksi terputus. Periksa internet Anda.';
          } else if (e is ApiException) {
            errMsg = e.message;
          } else {
             errMsg = 'Gagal terhubung ke server.';
          }
        } else {
          errMsg = e.toString();
        }

        DgSnackbar.showError(context, message: errMsg);
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
                Text('Buat Akun', style: AppTypography.h2),
                const SizedBox(height: 4),
                Text(
                  'Daftar untuk mulai belanja bahan dapur segar',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 32),

                // Name
                Text('Nama Lengkap', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameCtrl,
                  validator: Validators.name,
                  decoration: const InputDecoration(
                    hintText: 'Masukkan nama lengkap',
                    prefixIcon: Icon(Icons.person_outlined),
                  ),
                ),
                const SizedBox(height: 20),

                // Email
                Text('Email', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                  decoration: const InputDecoration(
                    hintText: 'contoh@email.com',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 20),

                // Password
                Text('Password', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  validator: Validators.password,
                  decoration: InputDecoration(
                    hintText: 'Min. 8 karakter, 1 huruf besar, 1 angka',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Confirm Password
                Text('Konfirmasi Password', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmCtrl,
                  obscureText: true,
                  validator: (v) => Validators.confirmPassword(v, _passCtrl.text),
                  decoration: const InputDecoration(
                    hintText: 'Ulangi password',
                    prefixIcon: Icon(Icons.lock_outlined),
                  ),
                ),
                const SizedBox(height: 32),

                DgButton(
                  label: 'Daftar',
                  onPressed: _register,
                  isLoading: _loading,
                ),
                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Sudah punya akun? ',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                    ),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Text(
                        'Masuk',
                        style: AppTypography.labelLarge.copyWith(color: AppColors.primary),
                      ),
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
