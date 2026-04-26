import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import 'api_exception.dart';

/// Configured Dio HTTP client with auth interceptor.
class ApiClient {
  ApiClient({String? baseUrl, FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(),
        _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )) {
    _dio.interceptors.add(_authInterceptor());
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;

  final _unauthorizedController = StreamController<void>.broadcast();
  Stream<void> get onUnauthorized => _unauthorizedController.stream;

  Dio get dio => _dio;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  Future<void> setTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  Future<String?> get accessToken => _storage.read(key: _accessTokenKey);
  Future<String?> get refreshToken => _storage.read(key: _refreshTokenKey);

  InterceptorsWrapper _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: _accessTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try refresh
          final refresh = await _storage.read(key: _refreshTokenKey);
          if (refresh != null) {
            try {
              final response = await Dio().post(
                '${AppConfig.apiBaseUrl}/auth/refresh',
                data: {'refreshToken': refresh},
              );
              final newAccess = response.data['accessToken'] as String;
              final newRefresh = response.data['refreshToken'] as String;
              await setTokens(
                  accessToken: newAccess, refreshToken: newRefresh);

              // Retry original request
              error.requestOptions.headers['Authorization'] =
                  'Bearer $newAccess';
              final retryResponse = await _dio.fetch(error.requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              await clearTokens();
              _unauthorizedController.add(null);
            }
          } else {
            await clearTokens();
            _unauthorizedController.add(null);
          }
        }
        handler.next(error);
      },
    );
  }

  // Helper to handle DioExceptions
  Exception _handleError(Object e) {
    if (e is DioException && e.response != null) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return ApiException(
          message: data['message'].toString(), 
          statusCode: e.response?.statusCode
        );
      }
      return ApiException(
        message: 'Terjadi kesalahan pada server (Kode: ${e.response?.statusCode})', 
        statusCode: e.response?.statusCode
      );
    }
    return e as Exception;
  }

  // Convenience methods
  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get<T>(path, queryParameters: queryParameters);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> post<T>(String path, {dynamic data}) async {
    try {
      return await _dio.post<T>(path, data: data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> put<T>(String path, {dynamic data}) async {
    try {
      return await _dio.put<T>(path, data: data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> delete<T>(String path) async {
    try {
      return await _dio.delete<T>(path);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response<T>> upload<T>(String path, FormData formData) async {
    try {
      return await _dio.post<T>(path, data: formData);
    } catch (e) {
      throw _handleError(e);
    }
  }
}
