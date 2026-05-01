import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:core/utils/validators.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../providers/user_providers.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  bool _googleLoading = false;

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
      await ref.read(authRepositoryProvider).login(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      
      if (mounted) {
        // Invalidate current user state to trigger a fresh fetch
        ref.invalidate(authStateProvider);
        ref.invalidate(currentUserProvider);
        // Sync AuthNotifier so AppRouter knows user is authenticated
        await ref.read(authNotifierProvider.notifier).checkAuthStatus();
        if (mounted) {
          final redirect = GoRouterState.of(context).uri.queryParameters['redirect'];
          if (redirect != null && redirect.isNotEmpty) {
            context.go(Uri.decodeComponent(redirect));
          } else {
            context.go('/home');
          }
        }
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal masuk', error: e);
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loginWithGoogle() async {
    setState(() => _googleLoading = true);
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email'],
      );
      final GoogleSignInAccount? account = await googleSignIn.signIn();
      if (account == null) {
        // User canceled the sign-in flow
        setState(() => _googleLoading = false);
        return;
      }
      
      final GoogleSignInAuthentication auth = await account.authentication;
      final String? idToken = auth.idToken;
      
      if (idToken != null) {
        await ref.read(authNotifierProvider.notifier).loginWithGoogle(
          idToken: idToken,
          name: account.displayName ?? 'Google User',
          email: account.email,
          avatarUrl: account.photoUrl,
          googleId: account.id,
        );

        // Success flow
        ref.invalidate(authStateProvider);
        ref.invalidate(currentUserProvider);
        await ref.read(authNotifierProvider.notifier).checkAuthStatus();
        if (mounted) {
          final redirect = GoRouterState.of(context).uri.queryParameters['redirect'];
          if (redirect != null && redirect.isNotEmpty) {
            context.go(Uri.decodeComponent(redirect));
          } else {
            context.go('/home');
          }
        }
      } else {
        throw Exception("Gagal mendapatkan ID Token dari Google");
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Google Sign In gagal', error: e);
      }
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardOpen = keyboardHeight > 0;

    // When keyboard open → sheet grows to keep form visible
    final bottomSheetHeight = isKeyboardOpen
        ? screenHeight * 0.65 + keyboardHeight
        : screenHeight * 0.65;

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
                  'assets/images/mascot_login.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),

          // Layer 4: White Bottom Sheet with Form
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomSheetHeight.clamp(0, screenHeight * 0.9),
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
                        // Title Area
                        Center(
                          child: Column(
                            children: [
                              Text('Selamat Datang!', style: AppTypography.h2),
                              const SizedBox(height: 4),
                              Text(
                                'Masuk ke akun Dapur Gizi kamu',
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

                        // Divider
                        Row(
                          children: [
                            const Expanded(child: Divider()),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'atau',
                                style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                              ),
                            ),
                            const Expanded(child: Divider()),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Google login
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: (_loading || _googleLoading) ? null : _loginWithGoogle,
                            icon: _googleLoading 
                                ? const SizedBox(
                                    width: 24, height: 24, 
                                    child: CircularProgressIndicator(strokeWidth: 2)
                                  )
                                : SvgPicture.asset(
                                    'assets/images/google_logo.svg',
                                    height: 24,
                                  ),
                            label: Text(
                              _googleLoading ? 'Memproses...' : 'Masuk dengan Google', 
                              style: const TextStyle(color: AppColors.textPrimary)
                            ),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Register link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Belum punya akun? ',
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                            ),
                            GestureDetector(
                              onTap: () {
                                final redirect = GoRouterState.of(context).uri.queryParameters['redirect'];
                                final redirectParam = redirect != null ? '?redirect=${Uri.encodeComponent(redirect)}' : '';
                                context.push('/register$redirectParam');
                              },
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
