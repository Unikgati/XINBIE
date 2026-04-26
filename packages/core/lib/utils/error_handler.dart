import '../api/api_exception.dart';
import 'package:dio/dio.dart';

class ErrorHandler {
  static String getMessage(dynamic error) {
    if (error == null) return 'Terjadi kesalahan sistem';
    
    if (error is ApiException) {
      return error.message;
    }
    
    if (error is DioException) {
      if (error.type == DioExceptionType.connectionTimeout || 
          error.type == DioExceptionType.receiveTimeout) {
        return 'Koneksi internet bermasalah, silakan coba lagi';
      }
      if (error.response?.data is Map && error.response?.data['message'] != null) {
        return error.response?.data['message'].toString() ?? 'Terjadi kesalahan pada server';
      }
      return 'Koneksi ke server gagal';
    }
    
    if (error is Exception) {
      final str = error.toString();
      if (str.startsWith('Exception: ')) {
        return str.substring(11);
      }
      return str;
    }
    
    return error.toString();
  }
}
