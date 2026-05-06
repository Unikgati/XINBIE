import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Provider for categories — fetched once, cached.
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getCategories();
});

/// Provider for featured/home products.
final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getFeaturedProducts();
});

/// Provider for products by category.
final productsByCategoryProvider = FutureProvider.family<List<Product>, String?>((ref, categoryId) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProducts(categoryId: categoryId);
});

/// Provider for product search.
final productSearchProvider = FutureProvider.family<List<Product>, String>((ref, query) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProducts(search: query);
});

/// Provider for single product detail.
final productDetailProvider = FutureProvider.family<Product, String>((ref, id) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProduct(id);
});

/// Provider for promo/discount products.
final promoProductsProvider = FutureProvider<List<Product>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getPromoProducts();
});

/// AsyncNotifier for infinite scrolling of all products.
class PaginatedProductsNotifier extends AsyncNotifier<List<Product>> {
  int _page = 1;
  bool _hasMore = true;
  bool get hasMore => _hasMore;
  
  @override
  Future<List<Product>> build() async {
    _page = 1;
    _hasMore = true;
    return _fetchPage(_page);
  }

  Future<List<Product>> _fetchPage(int page) async {
    final repo = ref.watch(productRepositoryProvider);
    final newProducts = await repo.getProducts(page: page, limit: 10);
    if (newProducts.length < 10) {
      _hasMore = false;
    }
    return newProducts;
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading || state.isRefreshing || state.hasError) return;
    
    state = const AsyncLoading<List<Product>>().copyWithPrevious(state);
    
    try {
      _page++;
      final nextProducts = await _fetchPage(_page);
      state = AsyncData([...state.value!, ...nextProducts]);
    } catch (e, st) {
      _page--;
      state = AsyncError<List<Product>>(e, st).copyWithPrevious(state);
    }
  }
}

final paginatedProductsProvider = AsyncNotifierProvider<PaginatedProductsNotifier, List<Product>>(
  PaginatedProductsNotifier.new,
);

/// Provider for cooking videos.
final cookingVideosProvider = FutureProvider<List<CookingVideo>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getCookingVideos();
});
