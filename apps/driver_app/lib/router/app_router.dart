import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/splash/driver_splash_screen.dart';
import '../screens/auth/driver_login_screen.dart';
import '../screens/registration/driver_register_screen.dart';
import '../screens/registration/ktp_upload_screen.dart';
import '../screens/registration/verification_pending_screen.dart';
import '../screens/home/driver_home_shell.dart';
import '../screens/home/driver_home_screen.dart';
import '../screens/order/driver_order_detail_screen.dart';
import '../screens/history/driver_history_screen.dart';
import '../screens/earnings/driver_earnings_screen.dart';
import '../screens/earnings/withdrawal_screen.dart';
import '../screens/profile/driver_profile_screen.dart';
import '../screens/profile/bank_account_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const DriverSplashScreen()),
    GoRoute(path: '/login', builder: (_, __) => const DriverLoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const DriverRegisterScreen()),
    GoRoute(path: '/upload-ktp', builder: (_, __) => const KtpUploadScreen()),
    GoRoute(path: '/verification-pending', builder: (_, __) => const VerificationPendingScreen()),

    ShellRoute(
      navigatorKey: _shellKey,
      builder: (_, __, child) => DriverHomeShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const DriverHomeScreen()),
        GoRoute(path: '/history', builder: (_, __) => const DriverHistoryScreen()),
        GoRoute(path: '/earnings', builder: (_, __) => const DriverEarningsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const DriverProfileScreen()),
      ],
    ),

    GoRoute(
      path: '/order/:id',
      builder: (_, state) => DriverOrderDetailScreen(orderId: state.pathParameters['id']!),
    ),
    GoRoute(path: '/withdrawal', builder: (_, __) => const WithdrawalScreen()),
    GoRoute(path: '/bank-account', builder: (_, __) => const BankAccountScreen()),
  ],
);
