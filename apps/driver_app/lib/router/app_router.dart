import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/splash/driver_splash_screen.dart';
import '../screens/auth/driver_login_screen.dart';
import '../screens/auth/driver_otp_screen.dart';
import '../screens/auth/driver_forgot_password_screen.dart';
import '../screens/auth/driver_reset_password_screen.dart';
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

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import '../providers/driver_providers.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

class DriverRouterNotifier extends ChangeNotifier {
  DriverRouterNotifier(this.ref) {
    ref.listen<AuthState>(
      driverAuthNotifierProvider,
      (_, __) => notifyListeners(),
    );
  }

  final Ref ref;
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = DriverRouterNotifier(ref);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(driverAuthNotifierProvider);

      final isAuth = authState.maybeWhen(
        authenticated: (_) => true,
        orElse: () => false,
      );

      final isSplash = state.matchedLocation == '/splash';

      // All public/flow routes that don't require auth
      final isPublicRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/otp' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/reset-password' ||
          state.matchedLocation == '/upload-ktp' ||
          state.matchedLocation == '/verification-pending';

      if (isSplash) {
        return null;
      }

      // Not authenticated → must go to public routes
      if (!isAuth && !isPublicRoute) {
        return '/login';
      }

      // Authenticated + going to login/register ONLY → go through splash to check verification
      if (isAuth &&
          (state.matchedLocation == '/login' ||
           state.matchedLocation == '/register')) {
        return '/splash';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const DriverSplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const DriverLoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const DriverRegisterScreen()),
      GoRoute(
        path: '/otp',
        builder: (_, state) {
          final q = state.uri.queryParameters;
          return DriverOtpScreen(
            email: q['email'] ?? '',
            type: q['type'] ?? 'verification',
            phone: q['phone'] ?? '',
            vehicleType: q['vehicleType'] ?? 'Motor',
            vehiclePlate: q['vehiclePlate'] ?? '',
          );
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const DriverForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) {
          final q = state.uri.queryParameters;
          return DriverResetPasswordScreen(
            email: q['email'] ?? '',
            otp: q['otp'] ?? '',
          );
        },
      ),
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
});
