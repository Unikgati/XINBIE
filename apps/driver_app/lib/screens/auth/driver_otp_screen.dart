import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

/// OTP verification screen for driver app.
///
/// Supports two flows:
/// 1. type=verification → registration OTP (verify email → create driver profile → KTP upload)
/// 2. type=password_reset → forgot password OTP (verify OTP → reset password screen)
class DriverOtpScreen extends ConsumerStatefulWidget {
  const DriverOtpScreen({
    super.key,
    required this.email,
    required this.type,
    this.phone = '',
    this.vehicleType = '',
    this.vehiclePlate = '',
  });

  final String email;
  final String type;
  final String phone;
  final String vehicleType;
  final String vehiclePlate;

  @override
  ConsumerState<DriverOtpScreen> createState() => _DriverOtpScreenState();
}

class _DriverOtpScreenState extends ConsumerState<DriverOtpScreen> {
  final _pinController = TextEditingController();
  final _focusNode = FocusNode();
  bool _loading = false;

  // Resend cooldown
  int _resendCooldown = 60;
  Timer? _resendTimer;
  bool get _canResend => _resendCooldown <= 0;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _pinController.dispose();
    _focusNode.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    _resendCooldown = 60;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _resendCooldown--;
        if (_resendCooldown <= 0) timer.cancel();
      });
    });
  }

  Future<void> _resendOtp() async {
    if (!_canResend) return;
    try {
      await ref.read(authRepositoryProvider).resendOtp(
        email: widget.email,
        type: widget.type,
      );
      if (mounted) {
        DgSnackbar.showSuccess(context, message: 'OTP baru telah dikirim');
        _startCooldown();
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal mengirim ulang OTP');
      }
    }
  }

  Future<void> _verify() async {
    final otp = _pinController.text;
    if (otp.length != 6) return;
    setState(() => _loading = true);

    try {
      if (widget.type == 'verification') {
        // Registration flow: verify email → create driver profile → KTP upload
        //
        // IMPORTANT: Do NOT call setAuthenticated() before navigation!
        // verifyEmail() already sets tokens on ApiClient internally.
        // Calling setAuthenticated() triggers GoRouter's refreshListenable,
        // which re-evaluates the current route and can redirect to /home
        // before context.go('/upload-ktp') executes.
        final authState = await ref.read(authRepositoryProvider).verifyEmail(
          email: widget.email,
          otp: otp,
        );
        // API client now has USER token (set by verifyEmail internally)

        // Create driver profile — works because /register doesn't require DRIVER role
        try {
          final regData = await ref.read(driverRepositoryProvider).register(
            name: '',
            email: widget.email,
            phone: widget.phone,
            password: '',
            vehicleType: widget.vehicleType,
            vehiclePlate: widget.vehiclePlate,
          );

          // Update tokens with DRIVER role JWT from backend
          if (regData['accessToken'] != null && regData['refreshToken'] != null) {
            final api = ref.read(apiClientProvider);
            await api.setTokens(
              accessToken: regData['accessToken'],
              refreshToken: regData['refreshToken'],
            );
          }
        } catch (regError) {
          // Driver profile creation failed, but account exists.
          // Log error but still navigate — login flow will handle re-registration
          debugPrint('Driver register failed: $regError');
        }

        if (mounted) {
          DgSnackbar.showSuccess(context, message: 'Verifikasi berhasil!');
          // Navigate FIRST, then set auth state
          context.go('/upload-ktp');
          // Now safe to update auth state — we're already navigating to /upload-ktp
          ref.read(driverAuthNotifierProvider.notifier).setAuthenticated(authState);
        }
      } else if (widget.type == 'password_reset') {
        // Forgot password flow: verify OTP → navigate to reset password screen
        await ref.read(authRepositoryProvider).verifyResetOtp(
          email: widget.email,
          otp: otp,
        );
        if (mounted) {
          context.push('/reset-password?email=${widget.email}&otp=$otp');
        }
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
        errMsg = errMsg.replaceAll('Exception: ', '');
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
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.mark_email_read, size: 36, color: AppColors.primary),
              ),
              const SizedBox(height: 24),
              Text('Verifikasi Email', style: AppTypography.h3),
              const SizedBox(height: 8),
              Text(
                'Kode OTP telah dikirim ke\n${widget.email}',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),

              Pinput(
                length: 6,
                controller: _pinController,
                focusNode: _focusNode,
                defaultPinTheme: PinTheme(
                  width: 56,
                  height: 64,
                  textStyle: AppTypography.h3,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                focusedPinTheme: PinTheme(
                  width: 56,
                  height: 64,
                  textStyle: AppTypography.h3,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary, width: 2),
                  ),
                ),
                onCompleted: (_) => _verify(),
              ),
              const SizedBox(height: 32),

              DgButton(
                label: 'Verifikasi',
                onPressed: _verify,
                isLoading: _loading,
              ),
              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Tidak menerima kode? ',
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                  GestureDetector(
                    onTap: _canResend ? _resendOtp : null,
                    child: Text(
                      _canResend ? 'Kirim Ulang' : 'Kirim Ulang (${_resendCooldown}s)',
                      style: AppTypography.labelLarge.copyWith(
                        color: _canResend ? AppColors.primary : AppColors.textHint,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
