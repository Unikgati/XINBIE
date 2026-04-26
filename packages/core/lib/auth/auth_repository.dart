import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/user.dart';
import 'auth_state.dart';

import 'package:dio/dio.dart';

/// Auth repository — handles login, register, OTP, password reset.
class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Stream<void> get onUnauthorized => _api.onUnauthorized;

  Future<AuthState> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post(ApiEndpoints.login, data: {
      'email': email,
      'password': password,
    });
    final data = response.data as Map<String, dynamic>;
    await _api.setTokens(
      accessToken: data['accessToken'],
      refreshToken: data['refreshToken'],
    );
    return AuthState.authenticated(
      user: User.fromJson(data['user']),
    );
  }

  Future<AuthState> loginWithGoogle({
    required String idToken,
    required String name,
    required String email,
    String? avatarUrl,
    required String googleId,
  }) async {
    final response = await _api.post(ApiEndpoints.google, data: {
      'idToken': idToken,
      'name': name,
      'email': email,
      'avatarUrl': avatarUrl,
      'googleId': googleId,
    });
    final data = response.data as Map<String, dynamic>;
    await _api.setTokens(
      accessToken: data['accessToken'],
      refreshToken: data['refreshToken'],
    );
    return AuthState.authenticated(
      user: User.fromJson(data['user']),
    );
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    await _api.post(ApiEndpoints.register, data: {
      'name': name,
      'email': email,
      'password': password,
    });
  }

  Future<AuthState> verifyEmail({
    required String email,
    required String otp,
  }) async {
    final response = await _api.post(ApiEndpoints.verifyEmail, data: {
      'email': email,
      'otp': otp,
    });
    final data = response.data as Map<String, dynamic>;
    await _api.setTokens(
      accessToken: data['accessToken'],
      refreshToken: data['refreshToken'],
    );
    return AuthState.authenticated(
      user: User.fromJson(data['user']),
    );
  }

  Future<void> resendOtp({required String email, required String type}) async {
    await _api.post(ApiEndpoints.resendOtp, data: {
      'email': email,
      'type': type,
    });
  }

  Future<void> forgotPassword({required String email}) async {
    await _api.post(ApiEndpoints.forgotPassword, data: {'email': email});
  }

  Future<void> verifyResetOtp({
    required String email,
    required String otp,
  }) async {
    await _api.post(ApiEndpoints.verifyResetOtp, data: {
      'email': email,
      'otp': otp,
    });
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    await _api.post(ApiEndpoints.resetPassword, data: {
      'email': email,
      'otp': otp,
      'password': newPassword,
    });
  }

  Future<User> getMe() async {
    final response = await _api.get(ApiEndpoints.me);
    return User.fromJson(response.data as Map<String, dynamic>);
  }

  Future<User> updateProfile({
    String? name,
    String? phoneWa,
    String? avatarPath,
  }) async {
    final formData = FormData.fromMap({
      if (name != null) 'name': name,
      if (phoneWa != null) 'phoneWa': phoneWa,
      if (avatarPath != null)
        'avatar': await MultipartFile.fromFile(
          avatarPath,
          filename: avatarPath.split('/').last.contains('.') 
            ? avatarPath.split('/').last 
            : '${avatarPath.split('/').last}.jpg',
        ),
    });

    final response = await _api.put(ApiEndpoints.profile, data: formData);
    return User.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> updateFcmToken(String token) async {
    await _api.put(ApiEndpoints.fcmToken, data: {'fcmToken': token});
  }

  Future<void> logout() async {
    await _api.post(ApiEndpoints.logout);
    await _api.clearTokens();
  }

  Future<bool> isLoggedIn() async {
    final token = await _api.accessToken;
    return token != null;
  }
}

/// Provider for AuthRepository.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

/// Provider for ApiClient.
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});
