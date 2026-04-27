import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/region.dart';
import '../auth/auth_repository.dart';

/// Repository for Indonesian region data (cascading dropdowns).
class RegionRepository {
  RegionRepository(this._api);

  final ApiClient _api;

  Future<List<Region>> getProvinces() async {
    final response = await _api.get(ApiEndpoints.provinces);
    final list = response.data as List;
    return list.map((e) => Region.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Region>> getCities(String provinceId) async {
    final response = await _api.get(ApiEndpoints.cities(provinceId));
    final list = response.data as List;
    return list.map((e) => Region.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Region>> getDistricts(String cityId) async {
    final response = await _api.get(ApiEndpoints.districts(cityId));
    final list = response.data as List;
    return list.map((e) => Region.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Region>> getVillages(String districtId) async {
    final response = await _api.get(ApiEndpoints.villages(districtId));
    final list = response.data as List;
    return list.map((e) => Region.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final regionRepositoryProvider = Provider<RegionRepository>((ref) {
  return RegionRepository(ref.watch(apiClientProvider));
});
