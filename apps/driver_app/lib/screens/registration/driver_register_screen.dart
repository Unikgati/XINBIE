import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:core/utils/validators.dart';

class DriverRegisterScreen extends ConsumerStatefulWidget {
  const DriverRegisterScreen({super.key});
  @override
  ConsumerState<DriverRegisterScreen> createState() => _DriverRegisterScreenState();
}

class _DriverRegisterScreenState extends ConsumerState<DriverRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  String _vehicleType = 'Motor';
  final _plateCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    _plateCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      // 1. Register user → data simpan di Redis + kirim OTP
      await ref.read(authRepositoryProvider).register(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );

      // 2. Navigate ke OTP screen, bawa data driver
      if (mounted) {
        final params = {
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'vehicleType': _vehicleType,
          'vehiclePlate': _plateCtrl.text.trim(),
        };
        final query = params.entries
            .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
            .join('&');
        context.push('/otp?type=verification&$query');
      }
    } catch (e) {
      if (mounted) {
        String errMsg = 'Terjadi kesalahan, silakan coba lagi.';
        if (e is ApiException) {
          errMsg = e.message;
        } else if (e.toString().contains('DioException')) {
          if (e.toString().contains('timeout')) {
            errMsg = 'Koneksi terputus. Periksa internet Anda.';
          } else {
            errMsg = 'Gagal terhubung ke server.';
          }
        }
        DgSnackbar.showError(context, message: errMsg);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Daftar Driver')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mau jadi driver?', style: AppTypography.h2),
              const SizedBox(height: 8),
              Text(
                'Lengkapi data berikut untuk mendaftar sebagai driver Dapur Gizi',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 32),

              // Nama Lengkap
              Text('Nama Lengkap', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.words,
                validator: Validators.name,
                decoration: const InputDecoration(
                  hintText: 'Masukkan nama lengkap',
                  prefixIcon: Icon(Icons.person_outlined),
                ),
              ),
              const SizedBox(height: 16),

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
              const SizedBox(height: 16),

              // WhatsApp
              Text('No. WhatsApp', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                validator: (v) => v == null || v.trim().isEmpty ? 'No. WhatsApp wajib diisi' : null,
                decoration: const InputDecoration(
                  hintText: '08xxxxxxxxxx',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 16),

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
              const SizedBox(height: 16),

              // Konfirmasi Password
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
              const SizedBox(height: 16),

              // Vehicle type
              Text('Tipe Kendaraan', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              DgDropdownField<String>(
                items: const ['Motor', 'Mobil'],
                value: _vehicleType,
                hintText: 'Pilih tipe kendaraan',
                iconBuilder: (v) => v == 'Mobil' ? Icons.directions_car_outlined : Icons.two_wheeler,
                onChanged: (v) => setState(() => _vehicleType = v!),
              ),
              const SizedBox(height: 16),

              // Plat nomor
              Text('Plat Nomor', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _plateCtrl,
                textCapitalization: TextCapitalization.characters,
                validator: (v) => v == null || v.trim().isEmpty ? 'Plat nomor wajib diisi' : null,
                decoration: const InputDecoration(
                  hintText: 'B 1234 ABC',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              const SizedBox(height: 32),

              DgButton(
                label: 'Daftar Sekarang',
                isLoading: _loading,
                onPressed: _register,
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
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
