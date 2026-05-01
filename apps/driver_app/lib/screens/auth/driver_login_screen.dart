import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class DriverLoginScreen extends ConsumerStatefulWidget {
  const DriverLoginScreen({super.key});
  @override
  ConsumerState<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends ConsumerState<DriverLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      await ref.read(driverAuthNotifierProvider.notifier).login(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );

      final authState = ref.read(driverAuthNotifierProvider);
      authState.maybeWhen(
        error: (message) {
          if (mounted) {
            DgSnackbar.showError(context, message: message);
          }
        },
        authenticated: (_) async {
          if (!mounted) return;
          // Check driver verification status before routing
          try {
            final driverRepo = ref.read(driverRepositoryProvider);
            final status = await driverRepo.getVerificationStatus();
            if (!mounted) return;

            final verStatus = status['status'] as String?;
            final hasKtp = status['ktpPhotoUrl'] != null;

            if (verStatus == 'APPROVED') {
              context.go('/home');
            } else if (verStatus == 'REJECTED' || !hasKtp) {
              context.go('/upload-ktp');
            } else {
              context.go('/verification-pending');
            }
          } catch (_) {
            // No driver profile yet — create one and go to KTP upload
            if (!mounted) return;
            try {
              final driverRepo = ref.read(driverRepositoryProvider);
              final regData = await driverRepo.register(
                name: '',
                email: _emailCtrl.text.trim(),
                phone: '',
                password: '',
                vehicleType: 'Motor',
                vehiclePlate: '',
              );
              // Update tokens with DRIVER role
              if (regData['accessToken'] != null && regData['refreshToken'] != null) {
                final api = ref.read(apiClientProvider);
                await api.setTokens(
                  accessToken: regData['accessToken'],
                  refreshToken: regData['refreshToken'],
                );
              }
              if (mounted) context.go('/upload-ktp');
            } catch (regErr) {
              // If already registered as driver, just go to upload-ktp
              if (mounted) context.go('/upload-ktp');
            }
          }
        },
        orElse: () {},
      );
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal masuk', error: e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardOpen = keyboardHeight > 0;

    // When keyboard open → sheet takes more space so form stays visible
    final bottomSheetHeight = isKeyboardOpen
        ? screenHeight * 0.60 + keyboardHeight
        : screenHeight * 0.60;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // Layer 1: Gradient Background
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: AppColors.onboardingGradient,
            ),
          ),

          // Layer 2: Logo at top left
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.only(top: 24, left: 24),
                child: SvgPicture.asset(
                  'assets/images/logo.svg',
                  height: 32,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),

          // Layer 3: Mascot (hidden when keyboard open)
          if (!isKeyboardOpen)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              bottom: bottomSheetHeight - 40,
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Image.asset(
                  'assets/images/mascot_driver.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),

          // Layer 4: White Bottom Sheet
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomSheetHeight.clamp(0, screenHeight * 0.85),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(32, 32, 32, 24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        Center(
                          child: Column(
                            children: [
                              Text('Selamat Datang!', style: AppTypography.h2),
                              const SizedBox(height: 4),
                              Text(
                                'Masuk ke akun Driver Dapur Gizi',
                                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),

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
                        const SizedBox(height: 8),

                        // Forgot password
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Lupa Password?',
                              style: AppTypography.bodySmall.copyWith(color: AppColors.primary),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Login button
                        DgButton(
                          label: 'Masuk',
                          onPressed: _login,
                          isLoading: _loading,
                        ),
                        const SizedBox(height: 24),

                        // Register link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Belum jadi driver? ',
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                            ),
                            GestureDetector(
                              onTap: () => context.push('/register'),
                              child: Text(
                                'Daftar',
                                style: AppTypography.labelLarge.copyWith(color: AppColors.primary),
                              ),
                            ),
                          ],
                        ),
                        // Extra space for keyboard
                        SizedBox(height: keyboardHeight > 0 ? keyboardHeight : 0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
