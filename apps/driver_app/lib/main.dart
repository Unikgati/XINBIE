import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'router/app_router.dart';
import 'providers/driver_providers.dart';
import 'services/background_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase
  await Firebase.initializeApp();

  // FCM
  await NotificationService.instance.init();

  // Background Service
  await BackgroundLocationService().initialize();

  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  runApp(const ProviderScope(child: DapurGiziDriverApp()));
}

class DapurGiziDriverApp extends ConsumerStatefulWidget {
  const DapurGiziDriverApp({super.key});
  @override
  ConsumerState<DapurGiziDriverApp> createState() => _DapurGiziDriverAppState();
}

class _DapurGiziDriverAppState extends ConsumerState<DapurGiziDriverApp> {
  @override
  void initState() {
    super.initState();
    _setupFcm();
  }

  void _setupFcm() {
    final notifService = ref.read(notificationServiceProvider);

    // Send FCM token to backend when available
    final token = notifService.fcmToken;
    if (token != null) _sendToken(token);

    // Listen for token refresh
    notifService.onTokenRefresh.listen(_sendToken);

    // Handle notification tap → navigate to order
    notifService.onNotificationTap.listen((data) {
      final orderId = data['orderId'] as String?;
      if (orderId != null) {
        final router = ref.read(routerProvider);
        router.push('/order/$orderId');
      }
    });

    // Subscribe to driver topic
    notifService.subscribeToDriverTopic();
  }

  void _sendToken(String token) {
    final authState = ref.read(driverAuthNotifierProvider);
    authState.maybeWhen(
      authenticated: (_) {
        ref.read(authRepositoryProvider).updateFcmToken(token);
      },
      orElse: () {},
    );
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Dapur Gizi Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
