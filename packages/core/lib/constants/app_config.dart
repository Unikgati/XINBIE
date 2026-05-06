import 'package:flutter/foundation.dart';

/// App-wide configuration constants.
class AppConfig {
  AppConfig._();

  static const String appName = 'Dapur Gizi';
  static const String appNameDriver = 'Dapur Gizi Driver';

  // API
  // Override via: flutter run --dart-define=BACKEND_URL=https://api.dapurgizi.com
  static const String _envBackendUrl = String.fromEnvironment('BACKEND_URL');

  static String get apiBaseUrl {
    // 1. Gunakan env var jika ada (production/staging build)
    if (_envBackendUrl.isNotEmpty) return '$_envBackendUrl/api';
    // 2. Fallback dev: Android emulator pakai 10.0.2.2, lainnya localhost
    if (kIsWeb) return 'http://localhost:3001/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3001/api';
    }
    return 'http://localhost:3001/api';
  }

  static String get _baseServerUrl {
    if (_envBackendUrl.isNotEmpty) return _envBackendUrl;
    if (kIsWeb) return 'http://localhost:3001';
    if (defaultTargetPlatform == TargetPlatform.android) return 'http://10.0.2.2:3001';
    return 'http://localhost:3001';
  }

  /// Normalize image URL: relative path → absolute, localhost → 10.0.2.2 on Android emulator.
  static String fixImageUrl(String? url) {
    if (url == null || url.trim().isEmpty) return '';
    String finalUrl = url.trim();
    // Relative path → prepend base server URL
    if (finalUrl.startsWith('/')) {
      finalUrl = '$_baseServerUrl$finalUrl';
    }
    // On Android emulator, replace localhost → 10.0.2.2
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      finalUrl = finalUrl.replaceAll('localhost', '10.0.2.2');
    }
    return finalUrl;
  }

  // Pagination
  static const int pageSize = 20;

  // OTP
  static const int otpLength = 6;
  static const int otpExpiryMinutes = 10;
  static const int otpMaxAttempts = 5;
  static const int otpLockMinutes = 10;

  // Upload
  static const int maxImageSizeBytes = 2 * 1024 * 1024; // 2MB
  static const int maxImageWidth = 800;
  static const int imageQuality = 85;

  // Payment
  static const int qrisTimeoutMinutes = 15;
  static const int vaTimeoutHours = 24;
  static const int paymentPollingSeconds = 5;

  // Driver
  static const int orderOfferTimeoutSeconds = 30;
  static const int gpsUpdateIntervalSeconds = 15;

  // Cart
  static const int maxCartItems = 50;

  // Order code prefix
  static const String orderCodePrefix = 'DG';
}
