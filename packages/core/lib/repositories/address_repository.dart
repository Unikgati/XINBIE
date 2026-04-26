import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/address.dart';
import '../auth/auth_repository.dart';

/// Repository for address management.
class AddressRepository {
  AddressRepository(this._api);

  final ApiClient _api;

  Future<List<Address>> getAddresses() async {
    final response = await _api.get(ApiEndpoints.addresses);
    final list = response.data as List;
    return list.map((e) => Address.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Address> createAddress({
    required String label,
    required String recipientName,
    required String phone,
    required String fullAddress,
    double? latitude,
    double? longitude,
    String? notes,
    bool isPrimary = false,
  }) async {
    final response = await _api.post(ApiEndpoints.addresses, data: {
      'label': label,
      'recipientName': recipientName,
      'phoneWa': phone,
      'fullAddress': fullAddress,
      if (latitude != null) 'lat': latitude,
      if (longitude != null) 'lng': longitude,
      if (notes != null) 'notes': notes,
      'isPrimary': isPrimary,
    });
    return Address.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Address> updateAddress(String id, Map<String, dynamic> data) async {
    final response = await _api.put(ApiEndpoints.address(id), data: data);
    return Address.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteAddress(String id) async {
    await _api.delete(ApiEndpoints.address(id));
  }

  Future<void> setPrimary(String id) async {
    await _api.put(ApiEndpoints.addressSetPrimary(id));
  }
}

final addressRepositoryProvider = Provider<AddressRepository>((ref) {
  return AddressRepository(ref.watch(apiClientProvider));
});
