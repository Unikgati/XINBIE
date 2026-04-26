import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Auth state notifier — manages login/logout/register flow.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repo) : super(const AuthState.initial()) {
    _unauthorizedSubscription = _repo.onUnauthorized.listen((_) {
      state = const AuthState.unauthenticated();
    });
  }

  final AuthRepository _repo;
  late final StreamSubscription _unauthorizedSubscription;

  @override
  void dispose() {
    _unauthorizedSubscription.cancel();
    super.dispose();
  }

  Future<void> checkAuthStatus() async {
    state = const AuthState.loading();
    try {
      final loggedIn = await _repo.isLoggedIn();
      if (loggedIn) {
        final user = await _repo.getMe();
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
      state = await _repo.login(email: email, password: password);
    } catch (e) {
      state = AuthState.error(message: e.toString());
    }
  }

  Future<void> loginWithGoogle({
    required String idToken,
    required String name,
    required String email,
    String? avatarUrl,
    required String googleId,
  }) async {
    state = const AuthState.loading();
    try {
      state = await _repo.loginWithGoogle(
        idToken: idToken,
        name: name,
        email: email,
        avatarUrl: avatarUrl,
        googleId: googleId,
      );
    } catch (e) {
      state = AuthState.error(message: e.toString());
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    state = const AuthState.loading();
    try {
      await _repo.register(name: name, email: email, password: password);
      // Stay in loading — user needs to verify OTP
    } catch (e) {
      state = AuthState.error(message: e.toString());
    }
  }

  Future<void> verifyEmail({required String email, required String otp}) async {
    state = const AuthState.loading();
    try {
      state = await _repo.verifyEmail(email: email, otp: otp);
    } catch (e) {
      state = AuthState.error(message: e.toString());
    }
  }

  Future<void> logout() async {
    try {
      await _repo.logout();
    } finally {
      state = const AuthState.unauthenticated();
    }
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});
