import 'package:flutter/foundation.dart' hide Category;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_providers.dart';
import '../api/api_endpoints.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/cooking_video.dart';
import '../models/flash_sale.dart';
import '../auth/auth_repository.dart';

/// Repository for product and category API calls.
class ProductRepository {
  ProductRepository(this._api);

  final ApiClient _api;

  Future<List<Category>> getCategories() async {
    final response = await _api.get(ApiEndpoints.categories);
    final list = response.data as List;
    return list.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Product>> getProducts({
    String? categoryId,
    String? search,
    bool promo = false,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (categoryId != null) 'categoryId': categoryId,
      if (search != null && search.isNotEmpty) 'search': search,
      if (promo) 'promo': true,
    };
    final response = await _api.get(ApiEndpoints.products, queryParameters: params);
    final data = response.data as Map<String, dynamic>;
    final list = (data['data'] ?? data['products']) as List;
    return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Product>> getFeaturedProducts() async {
    final response = await _api.get(ApiEndpoints.products, queryParameters: {
      'featured': true,
      'limit': 10,
    });
    final data = response.data as Map<String, dynamic>;
    final list = (data['data'] ?? data['products']) as List;
    return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Product>> getPromoProducts() async {
    final response = await _api.get(ApiEndpoints.products, queryParameters: {
      'promo': true,
      'limit': 10,
    });
    final data = response.data as Map<String, dynamic>;
    final list = (data['data'] ?? data['products']) as List;
    return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Product> getProduct(String id) async {
    try {
      debugPrint('Fetching product detail for ID: $id');
      final response = await _api.get(ApiEndpoints.product(id));
      
      final data = response.data;
      if (data == null) {
        throw Exception('API returned null data for product $id');
      }
      
      if (data is! Map<String, dynamic>) {
        throw Exception('Expected Map from API but got ${data.runtimeType}: $data');
      }
      
      return Product.fromJson(data);
    } catch (e) {
      debugPrint('Error in getProduct($id): $e');
      rethrow;
    }
  }

  Future<List<CookingVideo>> getCookingVideos({int page = 1, int limit = 10}) async {
    final response = await _api.get(ApiEndpoints.cookingVideos, queryParameters: {
      'page': page,
      'limit': limit,
    });
    final data = response.data as Map<String, dynamic>;
    final list = data['data'] as List;
    return list.map((e) => CookingVideo.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<FlashSaleSession>> getFlashSales({String status = 'active'}) async {
    final response = await _api.get(
      ApiEndpoints.flashSales,
      queryParameters: {'status': status},
    );
    final list = response.data as List;
    return list
        .map((e) => FlashSaleSession.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.watch(apiClientProvider));
});
