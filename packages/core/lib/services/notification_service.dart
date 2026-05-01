import 'dart:async';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Background message handler — must be top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Background messages handled by system tray automatically
}

/// FCM + Local Notification service for driver app.
class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();

  final _messaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  final _onTokenRefresh = StreamController<String>.broadcast();
  Stream<String> get onTokenRefresh => _onTokenRefresh.stream;

  final _onNotificationTap = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get onNotificationTap => _onNotificationTap.stream;

  final _onForegroundMessage = StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get onForegroundMessage => _onForegroundMessage.stream;

  /// Android notification channel for driver orders.
  static const _orderChannel = AndroidNotificationChannel(
    'driver_orders',
    'Pesanan Baru',
    description: 'Notifikasi pesanan baru untuk driver',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  /// General channel.
  static const _generalChannel = AndroidNotificationChannel(
    'general',
    'Umum',
    description: 'Notifikasi umum',
    importance: Importance.defaultImportance,
  );

  /// Initialize FCM + local notifications.
  Future<void> init() async {
    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return;
    }

    // Setup local notifications
    await _setupLocalNotifications();

    // Get token
    _fcmToken = await _messaging.getToken();

    // Listen token refresh
    _messaging.onTokenRefresh.listen((token) {
      _fcmToken = token;
      _onTokenRefresh.add(token);
    });

    // Background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

    // Foreground messages → show local notification
    FirebaseMessaging.onMessage.listen((message) {
      _onForegroundMessage.add(message);
      _showLocalNotification(message);
    });

    // Notification tap (app in background → opened)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _onNotificationTap.add(message.data);
    });

    // Check if app opened from notification (terminated state)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _onNotificationTap.add(initialMessage.data);
    }
  }

  Future<void> _setupLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null) {
          // Parse payload as order ID
          _onNotificationTap.add({'orderId': payload, 'type': 'order_tap'});
        }
      },
    );

    // Create notification channels (Android only)
    if (Platform.isAndroid) {
      final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      await androidPlugin?.createNotificationChannel(_orderChannel);
      await androidPlugin?.createNotificationChannel(_generalChannel);
    }
  }

  /// Show local notification from FCM message.
  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final isOrder = message.data['type'] == 'new_order' || message.data['type'] == 'order_update';
    final channel = isOrder ? _orderChannel : _generalChannel;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channel.id,
          channel.name,
          channelDescription: channel.description,
          importance: channel.importance,
          priority: isOrder ? Priority.max : Priority.defaultPriority,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data['orderId'],
    );
  }

  /// Subscribe to driver-specific topic.
  Future<void> subscribeToDriverTopic() async {
    await _messaging.subscribeToTopic('driver_all');
  }

  /// Unsubscribe from driver topic.
  Future<void> unsubscribeFromDriverTopic() async {
    await _messaging.unsubscribeFromTopic('driver_all');
  }

  void dispose() {
    _onTokenRefresh.close();
    _onNotificationTap.close();
    _onForegroundMessage.close();
  }
}

/// Provider for NotificationService.
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService.instance;
});
