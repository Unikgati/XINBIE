import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import 'package:core/core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Screens
import '../screens/splash/splash_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/home/home_shell.dart';
import '../screens/home/home_screen.dart';
import '../screens/category/category_screen.dart';
import '../screens/product/product_detail_screen.dart';
import '../screens/product/cooking_video_player_screen.dart';
import '../screens/product/cooking_video_gallery_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/order/orders_screen.dart';
import '../screens/order/order_detail_screen.dart';
import '../screens/payment/payment_screen.dart';
import '../screens/payment/payment_success_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/profile/address_list_screen.dart';
import '../screens/profile/address_form_screen.dart';
import '../screens/notification/notification_screen.dart';
import '../screens/search/search_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class RouterNotifier extends ChangeNotifier {
  RouterNotifier(this.ref) {
    ref.listen<AuthState>(
      authNotifierProvider,
      (_, __) => notifyListeners(),
    );
  }

  final Ref ref;
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = RouterNotifier(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);

      final isAuth = authState.maybeWhen(
        authenticated: (_) => true,
        orElse: () => false,
      );

      final isSplash = state.matchedLocation == '/splash';
      final isGoingToAuth = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/otp' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/onboarding';

      // Define routes that require authentication
      final isProtected = state.matchedLocation.startsWith('/edit-profile') ||
          state.matchedLocation.startsWith('/address') ||
          state.matchedLocation.startsWith('/checkout') ||
          state.matchedLocation.startsWith('/orders/');

      if (isSplash) {
        return null; // Let splash screen decide initial routing
      }

      // If user is not authenticated and trying to access protected routes
      if (!isAuth && isProtected) {
        final redirectUri = Uri.encodeComponent(state.uri.toString());
        return '/login?redirect=$redirectUri';
      }

      // If user is authenticated and trying to access auth routes
      if (isAuth && isGoingToAuth) {
        final redirect = state.uri.queryParameters['redirect'];
        if (redirect != null && redirect.isNotEmpty) {
          return Uri.decodeComponent(redirect);
        }
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (_, __) => const OnboardingScreen(),
      ),

      // Auth
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (_, state) => OtpScreen(
          email: state.uri.queryParameters['email'] ?? '',
          type: state.uri.queryParameters['type'] ?? 'verification',
        ),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordScreen(
          email: state.uri.queryParameters['email'] ?? '',
          otp: state.uri.queryParameters['otp'] ?? '',
        ),
      ),

      // Main shell with bottom nav
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (_, __, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: '/orders',
            builder: (_, __) => const OrdersScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
        ],
      ),

      // Full screen routes (no bottom nav)
      GoRoute(
        path: '/orders/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) => OrderDetailScreen(
          orderId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/category/:id',
        builder: (_, state) => CategoryScreen(
          categoryId: state.pathParameters['id']!,
          categoryName: state.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(
        path: '/product/:id',
        builder: (_, state) => ProductDetailScreen(
          productId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/cart',
        builder: (_, __) => const CartScreen(),
      ),
      GoRoute(
        path: '/checkout',
        builder: (_, __) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/payment/:id',
        builder: (_, state) => PaymentScreen(
          orderId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/payment-success/:id',
        builder: (_, state) => PaymentSuccessScreen(
          orderId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/addresses',
        builder: (_, __) => const AddressListScreen(),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (_, __) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/address-form',
        builder: (_, state) => AddressFormScreen(
          address: state.extra as Address?,
        ),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationScreen(),
      ),
      GoRoute(
        path: '/search',
        builder: (_, __) => const SearchScreen(),
      ),
      GoRoute(
        path: '/cooking-video',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>;
          return CookingVideoPlayerScreen(
            video: extra['video'] as CookingVideo,
            relatedProducts: extra['products'] as List<Product>,
          );
        },
      ),
      GoRoute(
        path: '/cooking-video-gallery',
        builder: (_, __) => const CookingVideoGalleryScreen(),
      ),
    ],
  );
});
