import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../auth/auth_repository.dart';

/// Repository for driver-specific operations.
class DriverRepository {
  DriverRepository(this._api);

  final ApiClient _api;

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String vehicleType,
    required String vehiclePlate,
  }) async {
    await _api.post(ApiEndpoints.driverRegister, data: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'vehicleType': vehicleType,
      'vehiclePlate': vehiclePlate,
    });
  }

  Future<void> uploadKtp(String filePath) async {
    final formData = FormData.fromMap({
      'ktp': await MultipartFile.fromFile(filePath),
    });
    await _api.upload(ApiEndpoints.driverUploadKtp, formData);
  }

  Future<Map<String, dynamic>> getVerificationStatus() async {
    final response = await _api.get(ApiEndpoints.driverVerificationStatus);
    return response.data as Map<String, dynamic>;
  }

  Future<void> setOnlineStatus(bool online) async {
    await _api.put(ApiEndpoints.driverOnlineStatus, data: {'online': online});
  }

  Future<void> updateLocation({
    required double latitude,
    required double longitude,
  }) async {
    await _api.put(ApiEndpoints.driverLocation, data: {
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  Future<List<Map<String, dynamic>>> getActiveOrders() async {
    final response = await _api.get(ApiEndpoints.driverOrdersActive);
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> getOrderHistory() async {
    final response = await _api.get(ApiEndpoints.driverOrdersHistory);
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  Future<void> acceptOrder(String id) async {
    await _api.post(ApiEndpoints.driverOrderAccept(id));
  }

  Future<void> rejectOrder(String id) async {
    await _api.post(ApiEndpoints.driverOrderReject(id));
  }

  Future<void> updateOrderStatus(String id, String status) async {
    await _api.put(ApiEndpoints.driverOrderStatus(id), data: {'status': status});
  }

  Future<void> uploadDeliveryProof(String orderId, String filePath) async {
    final formData = FormData.fromMap({
      'proof': await MultipartFile.fromFile(filePath),
    });
    await _api.upload(ApiEndpoints.driverOrderProof(orderId), formData);
  }

  Future<void> reportProblem(String orderId, {
    required String type,
    required String description,
  }) async {
    await _api.post(ApiEndpoints.driverOrderProblem(orderId), data: {
      'type': type,
      'description': description,
    });
  }

  Future<void> confirmCod(String orderId, {required double amount}) async {
    await _api.post(ApiEndpoints.driverOrderCodConfirm(orderId), data: {
      'amount': amount,
    });
  }

  Future<Map<String, dynamic>> getEarnings({String? period}) async {
    final response = await _api.get(ApiEndpoints.driverEarnings, queryParameters: {
      if (period != null) 'period': period,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getWallet() async {
    final response = await _api.get(ApiEndpoints.driverWallet);
    return response.data as Map<String, dynamic>;
  }

  Future<void> requestWithdrawal(int amount) async {
    await _api.post(ApiEndpoints.driverWithdrawal, data: {'amount': amount});
  }

  Future<Map<String, dynamic>> getBankInfo() async {
    final response = await _api.get(ApiEndpoints.driverBank);
    return response.data as Map<String, dynamic>;
  }

  Future<void> updateBankInfo(Map<String, dynamic> data) async {
    await _api.put(ApiEndpoints.driverBank, data: data);
  }
}

final driverRepositoryProvider = Provider<DriverRepository>((ref) {
  return DriverRepository(ref.watch(apiClientProvider));
});
