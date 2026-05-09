import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_providers.dart';
import '../api/api_endpoints.dart';
import '../models/banner_model.dart';
import '../auth/auth_repository.dart';

/// Repository for fetching Banners
class BannerRepository {
  BannerRepository(this._api);

  final ApiClient _api;

  Future<List<BannerModel>> getBanners() async {
    final response = await _api.get(ApiEndpoints.banners);
    
    List list = [];
    if (response.data is List) {
      list = response.data as List;
    } else {
      final data = response.data as Map<String, dynamic>;
      list = (data['data'] ?? data['banners'] ?? []) as List;
    }

    return list.map((e) {
      final map = Map<String, dynamic>.from(e as Map);
      return BannerModel.fromJson(map);
    }).toList();
  }
}

final bannerRepositoryProvider = Provider<BannerRepository>((ref) {
  return BannerRepository(ref.watch(apiClientProvider));
});
