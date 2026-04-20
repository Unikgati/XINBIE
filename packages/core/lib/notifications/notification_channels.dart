// Placeholder — FCM setup handled per-app in main.dart
// This file provides shared notification handling utilities.

/// Notification channel IDs for Android.
class NotificationChannels {
  NotificationChannels._();

  // User app channels
  static const String userOrders = 'orders';
  static const String userPromos = 'promos';
  static const String userGeneral = 'general';

  // Driver app channels
  static const String driverOrders = 'orders';
  static const String driverVerification = 'verification';
  static const String driverGeneral = 'general';
}

/// FCM topic names.
class FcmTopics {
  FcmTopics._();

  static const String allUsers = 'all_users';
  static const String allDrivers = 'all_drivers';

  static String userId(String id) => 'user_$id';
  static String driverId(String id) => 'driver_$id';
}
