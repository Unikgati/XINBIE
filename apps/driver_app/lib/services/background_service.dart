import 'dart:async';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:core/core.dart'; // To access SocketService and ApiClient

// Ensure this is a top-level function
@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  // Bring to foreground
  if (service is AndroidServiceInstance) {
    service.setAsForegroundService();
  }

  // Setup periodic ping or socket reconnection here if needed
  // We can just rely on the existing SocketService if it is initialized,
  // but background isolates might need their own initialization.
  
  // Actually, just running the foreground service keeps the OS from killing the process.
  // The main isolate's socket will remain alive.
  
  service.on('stopService').listen((event) {
    service.stopSelf();
  });
}

class BackgroundLocationService {
  static final BackgroundLocationService _instance = BackgroundLocationService._internal();
  factory BackgroundLocationService() => _instance;
  BackgroundLocationService._internal();

  final service = FlutterBackgroundService();

  Future<void> initialize() async {
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'driver_foreground', // id
      'DapurGizi Driver Active', // title
      description: 'Layanan ini memastikan Anda tetap bisa menerima orderan saat aplikasi diminimize.', // description
      importance: Importance.low, // low importance prevents sound/vibration
    );

    final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
        FlutterLocalNotificationsPlugin();

    // we need to create the notification channel for Android 8+
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        // This will be executed when app is in background and starts service
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: 'driver_foreground',
        initialNotificationTitle: 'DapurGizi Driver Online',
        initialNotificationContent: 'Menunggu pesanan masuk...',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
      ),
    );
  }

  Future<void> startService() async {
    final isRunning = await service.isRunning();
    if (!isRunning) {
      await service.startService();
    }
  }

  void stopService() {
    service.invoke("stopService");
  }
}
