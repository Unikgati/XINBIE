import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/user_providers.dart';
import '../../providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.email, required this.type});
  final String email;
  final String type;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _pinController = TextEditingController();
  final _focusNode = FocusNode();
  bool _loading = false;
  bool _isResending = false;
  
  Timer? _timer;
  int _secondsRemaining = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    setState(() {
      _canResend = false;
      _secondsRemaining = 60;
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining == 0) {
        setState(() {
          _canResend = true;
          _timer?.cancel();
        });
      } else {
        setState(() {
          _secondsRemaining--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pinController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final otp = _pinController.text;
    if (otp.length != 6) return;
    setState(() => _loading = true);
    
    try {
      if (widget.type == 'verification') {
        await ref.read(authRepositoryProvider).verifyEmail(
          email: widget.email,
          otp: otp,
        );
        if (mounted) {
          DgSnackbar.showSuccess(context, message: 'Verifikasi berhasil! Masuk ke beranda...');
          
          ref.invalidate(authStateProvider);
          ref.invalidate(currentUserProvider);
          
          await ref.read(authNotifierProvider.notifier).checkAuthStatus();
          
          await Future.delayed(const Duration(seconds: 2));
          if (mounted) {
            final redirect = GoRouterState.of(context).uri.queryParameters['redirect'];
            if (redirect != null && redirect.isNotEmpty) {
              context.go(Uri.decodeComponent(redirect));
            } else {
              context.go('/home');
            }
          }
        }
      } else if (widget.type == 'password_reset') {
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

        // Clean up "Exception: " if present
        errMsg = errMsg.replaceAll('Exception: ', '');

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

              // OTP fields
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
                    onTap: (_canResend && !_isResending) ? () async {
                      setState(() => _isResending = true);
                      try {
                        await ref.read(authRepositoryProvider).resendOtp(
                          email: widget.email,
                          type: widget.type,
                        );
                        if (mounted) {
                          DgSnackbar.showSuccess(context, message: 'OTP baru telah dikirim');
                          _startTimer();
                        }
                      } catch (e) {
                        if (mounted) {
                          DgSnackbar.showError(context, message: 'Gagal', error: e);
                        }
                      } finally {
                        if (mounted) setState(() => _isResending = false);
                      }
                    } : null,
                    child: Text(
                      _canResend ? 'Kirim Ulang' : 'Kirim Ulang ($_secondsRemaining)',
                      style: AppTypography.labelLarge.copyWith(
                        color: (_canResend && !_isResending) ? AppColors.primary : AppColors.textSecondary,
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
