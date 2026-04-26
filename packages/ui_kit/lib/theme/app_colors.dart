import 'package:flutter/material.dart';

/// Color palette extracted from DapurGizi UI assets.
class AppColors {
  AppColors._();

  // Primary Green
  static const Color primary = Color(0xFF4CAF50);
  static const Color primaryDark = Color(0xFF2E7D32);
  static const Color primaryLight = Color(0xFF81C784);
  static const Color primaryAction = Color(0xFF9ECE67); // Action buttons
  static const Color primarySurface = Color(0xFFE8F5E9);

  // Surfaces
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF5F5F5);
  static const Color card = Color(0xFFFFFFFF);

  // Text
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textGreeting = Color(0xFF488044);

  // Price
  static const Color priceActive = Color(0xFF2E7D32);
  static const Color priceStrikethrough = Color(0xFF9E9E9E);

  // Status
  static const Color error = Color(0xFFF44336);
  static const Color warning = Color(0xFFFF9800);
  static const Color success = Color(0xFF4CAF50);
  static const Color info = Color(0xFF2196F3);

  // Cart badge
  static const Color cartBadge = Color(0xFFFF5722);

  // Discount badge
  static const Color discountBadge = Color(0xFF4CAF50);

  // Borders & Dividers
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFF0F0F0);

  // Shadows
  static const Color shadow = Color(0x1A000000);

  // Overlay for out of stock
  static const Color outOfStockOverlay = Color(0x99FFFFFF);

  // Gradient for hero banner
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF9ECE67), Color(0xFF2D6739)],
  );

  // Gradient for onboarding
  static const LinearGradient onboardingGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF9ECE67), Color(0xFF2D6739)],
  );
}
