import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import '../services/background_service.dart';

/// Driver auth notifier — extends base auth with driver-specific flows.
class DriverAuthNotifier extends StateNotifier<AuthState> {
  DriverAuthNotifier(this._authRepo) : super(const AuthState.initial()) {
    _unauthorizedSub = _authRepo.onUnauthorized.listen((_) {
      state = const AuthState.unauthenticated();
    });
  }

  final AuthRepository _authRepo;
  late final StreamSubscription _unauthorizedSub;

  @override
  void dispose() {
    _unauthorizedSub.cancel();
    super.dispose();
  }

  Future<void> checkAuthStatus() async {
    state = const AuthState.loading();
    try {
      final loggedIn = await _authRepo.isLoggedIn();
      if (loggedIn) {
        final user = await _authRepo.getMe();
        state = AuthState.authenticated(user: user);
      } else {
        state = const AuthState.unauthenticated();
      }
    } catch (e) {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AuthState.loading();
    try {
      state = await _authRepo.login(email: email, password: password);
    } catch (e) {
      state = AuthState.error(message: e.toString());
    }
  }

  /// Set authenticated state directly (e.g. after OTP verification).
  void setAuthenticated(AuthState authState) {
    state = authState;
  }

  Future<void> logout() async {
    try {
      await _authRepo.logout();
    } finally {
      state = const AuthState.unauthenticated();
    }
  }
}

final driverAuthNotifierProvider = StateNotifierProvider<DriverAuthNotifier, AuthState>((ref) {
  return DriverAuthNotifier(ref.watch(authRepositoryProvider));
});

/// Driver online status
class OnlineStatusNotifier extends StateNotifier<bool> {
  OnlineStatusNotifier(this._driverRepo) : super(false);

  final DriverRepository _driverRepo;

  Future<void> sync() async {
    try {
      final status = await _driverRepo.getVerificationStatus();
      final isOnline = status['isOnline'] as bool? ?? false;
      state = isOnline;
      if (isOnline) {
        await BackgroundLocationService().startService();
      }
    } catch (_) {
      // Ignore on error
    }
  }

  Future<void> toggle() async {
    final newStatus = !state;
    await _driverRepo.setOnlineStatus(newStatus);
    state = newStatus;
    
    if (newStatus) {
      await BackgroundLocationService().startService();
    } else {
      BackgroundLocationService().stopService();
    }
  }
}

final onlineStatusProvider = StateNotifierProvider<OnlineStatusNotifier, bool>((ref) {
  return OnlineStatusNotifier(ref.watch(driverRepositoryProvider));
});

/// Driver active orders
final driverActiveOrdersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(driverRepositoryProvider);
  return repo.getActiveOrders();
});

/// Driver order history
final driverOrderHistoryProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(driverRepositoryProvider);
  return repo.getOrderHistory();
});

/// Driver earnings
final driverEarningsProvider = FutureProvider.family<Map<String, dynamic>, String?>((ref, period) async {
  final repo = ref.watch(driverRepositoryProvider);
  return repo.getEarnings(period: period);
});

/// Verification status
final verificationStatusProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(driverRepositoryProvider);
  return repo.getVerificationStatus();
});

/// Driver wallet provider
final driverWalletProvider = FutureProvider<DriverWallet>((ref) async {
  final repo = ref.watch(driverRepositoryProvider);
  final data = await repo.getWallet();
  return DriverWallet.fromJson(data);
});

/// Bank info provider
final driverBankInfoProvider = FutureProvider<BankInfo>((ref) async {
  final repo = ref.watch(driverRepositoryProvider);
  final data = await repo.getBankInfo();
  return BankInfo.fromJson(data);
});
