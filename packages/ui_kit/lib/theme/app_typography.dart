import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Typography system matching DapurGizi UI.
class AppTypography {
  AppTypography._();

  // Base font
  static TextStyle get _base => GoogleFonts.poppins();

  // Headings
  static TextStyle get h1 => _base.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        height: 1.3,
      );

  static TextStyle get h2 => _base.copyWith(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        height: 1.3,
      );

  static TextStyle get h3 => _base.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        height: 1.3,
      );

  static TextStyle get h4 => _base.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.4,
      );

  // Body
  static TextStyle get bodyLarge => _base.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodyMedium => _base.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  static TextStyle get bodySmall => _base.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.4,
      );

  // Labels
  static TextStyle get labelLarge => _base.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.4,
      );

  static TextStyle get labelSmall => _base.copyWith(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        height: 1.3,
        letterSpacing: 0.5,
      );

  // Price
  static TextStyle get priceActive => _base.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        height: 1.2,
      );

  static TextStyle get priceStrikethrough => _base.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        decoration: TextDecoration.lineThrough,
        height: 1.2,
      );

  // Button
  static TextStyle get button => _base.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  // Caption
  static TextStyle get caption => _base.copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w400,
        height: 1.3,
      );
}
