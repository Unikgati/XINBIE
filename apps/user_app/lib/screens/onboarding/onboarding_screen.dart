import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:google_fonts/google_fonts.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomSheetHeight = screenHeight * 0.45;

    return Scaffold(
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

          // Logo at top left
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

          // Layer 2: Mascot
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: bottomSheetHeight - 80,
            child: Align(
              alignment: const Alignment(-0.4, 1.0),
              child: Image.asset(
                'assets/images/mascot.png',
                height: bottomSheetHeight * 1.15,
                fit: BoxFit.contain,
              ),
            ),
          ),

          // Layer 3: White Bottom Sheet
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              height: bottomSheetHeight,
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              padding: const EdgeInsets.fromLTRB(32, 48, 32, 40),
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    // Welcome Text
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Hi, Selamat Datang!',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.textGreeting,
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              height: 1.2,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Pesan bahan baku, snack, dan minuman dengan mudah untuk dapur Anda.',
                            style: AppTypography.bodyLarge.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),

                    // Action Button
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () => context.go('/home'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryAction,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          'Mulai Belanja',
                          style: AppTypography.button.copyWith(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
