import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:ui_kit/ui_kit.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingPageData {
  final String mascot;
  final String title;
  final String subtitle;
  _OnboardingPageData(this.mascot, this.title, this.subtitle);
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  final _pages = [
    _OnboardingPageData(
      'assets/images/mascot.png',
      'Hi, Selamat Datang!',
      'Pesan bahan baku, snack, dan minuman dengan mudah untuk dapur Anda.',
    ),
    _OnboardingPageData(
      'assets/images/mascot_2.png',
      'Bahan Berkualitas',
      'Pilihan sayur, buah, dan bahan dapur terbaik langsung dari petani pilihan.',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomSheetHeight = MediaQuery.of(context).size.height * 0.45;

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
                  height: 32, // Ukuran logo dikecilkan
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),

          // Layer 2: Sliding Mascot (Behind the bottom sheet)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: bottomSheetHeight - 60, // Membiarkan maskot tenggelam 60px di belakang sheet putih
            child: PageView.builder(
              controller: _controller,
              onPageChanged: (i) => setState(() => _page = i),
              itemCount: _pages.length,
              itemBuilder: (context, index) {
                return Align(
                  alignment: Alignment.bottomCenter,
                  child: Image.asset(
                    _pages[index].mascot,
                    height: bottomSheetHeight, // Reuse the calculated MediaQuery value (0.45 height)
                    fit: BoxFit.contain,
                    gaplessPlayback: true, // Prevents flickering when paging back
                  ),
                );
              },
            ),
          ),

          // Layer 3: Fixed White Bottom Sheet with Text & Actions
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              height: bottomSheetHeight,
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              padding: const EdgeInsets.fromLTRB(32, 40, 32, 40),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Text Area (Crossfade Animated)
                    Expanded(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        child: Column(
                          key: ValueKey<int>(_page),
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _pages[_page].title,
                              style: AppTypography.h1.copyWith(
                                color: AppColors.textGreeting,
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                height: 1.2,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _pages[_page].subtitle,
                              style: AppTypography.bodyLarge.copyWith(
                                color: AppColors.textSecondary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Setup actions (Dots & Button)
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Dots Slider
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            _pages.length,
                            (i) => AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              height: 8,
                              width: _page == i ? 24 : 8,
                              decoration: BoxDecoration(
                                color: _page == i
                                    ? AppColors.primaryAction
                                    : AppColors.primaryLight.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Button
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: () {
                              if (_page < _pages.length - 1) {
                                _controller.nextPage(
                                  duration: const Duration(milliseconds: 400),
                                  curve: Curves.easeInOut,
                                );
                              } else {
                                context.go('/home');
                              }
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.primaryAction,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
                              ),
                              splashFactory: NoSplash.splashFactory,
                              overlayColor: Colors.white.withValues(alpha: 0.1),
                            ),
                            child: Text(
                              _page < _pages.length - 1 ? 'Lanjut' : 'Mulai Belanja',
                              style: AppTypography.button.copyWith(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
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
