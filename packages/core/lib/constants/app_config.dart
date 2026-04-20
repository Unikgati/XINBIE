/// App-wide configuration constants.
class AppConfig {
  AppConfig._();

  static const String appName = 'Dapur Gizi';
  static const String appNameDriver = 'Dapur Gizi Driver';

  // API
  static const String apiBaseUrl = 'http://localhost:3001/api';

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
