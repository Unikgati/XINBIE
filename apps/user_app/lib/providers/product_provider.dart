import 'package:flutter/foundation.dart' show debugPrint;
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

/// AsyncNotifier for infinite scrolling of cooking videos.
class PaginatedCookingVideosNotifier extends AsyncNotifier<List<CookingVideo>> {
  int _page = 1;
  bool _hasMore = true;
  bool get hasMore => _hasMore;
  
  @override
  Future<List<CookingVideo>> build() async {
    _page = 1;
    _hasMore = true;
    return _fetchPage(_page);
  }

  Future<List<CookingVideo>> _fetchPage(int page) async {
    final repo = ref.watch(productRepositoryProvider);
    final newVideos = await repo.getCookingVideos(page: page, limit: 10);
    if (newVideos.length < 10) {
      _hasMore = false;
    }
    return newVideos;
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading || state.isRefreshing || state.hasError) return;
    
    state = const AsyncLoading<List<CookingVideo>>().copyWithPrevious(state);
    
    try {
      _page++;
      final nextVideos = await _fetchPage(_page);
      state = AsyncData([...state.value!, ...nextVideos]);
    } catch (e, st) {
      _page--;
      state = AsyncError<List<CookingVideo>>(e, st).copyWithPrevious(state);
    }
  }
}

final paginatedCookingVideosProvider = AsyncNotifierProvider<PaginatedCookingVideosNotifier, List<CookingVideo>>(
  PaginatedCookingVideosNotifier.new,
);

/// Provider for cooking videos (limited to 10 for home/simple list).
final cookingVideosProvider = FutureProvider<List<CookingVideo>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getCookingVideos(limit: 10);
});

/// Provider for the active flash sale session.
final activeFlashSaleProvider = FutureProvider<FlashSaleSession?>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  try {
    final sessions = await repo.getFlashSales(status: 'active');
    if (sessions.isNotEmpty) return sessions.first;
  } catch (e) {
    debugPrint('Error fetching active flash sale: $e');
  }
  return null;
});

/// Model for real-time stock updates.
class FlashSaleStockUpdate {
  final int soldQty;
  final int stockQty;
  FlashSaleStockUpdate({required this.soldQty, required this.stockQty});
}

/// Stores real-time stock updates for flash sale items.
final flashSaleStockUpdatesProvider = StateProvider<Map<String, FlashSaleStockUpdate>>((ref) => {});

/// Provider that listens to socket events and updates the flash sale stock state.
/// This should be watched at a top level to keep the connection alive and state fresh.
final flashSaleSocketProvider = Provider<void>((ref) {
  final socket = ref.watch(socketServiceProvider);
  
  socket.onFlashSaleStockUpdate((data) {
    final itemId = data['flashSaleItemId'] as String;
    final soldQty = data['soldQty'] as int;
    final stockQty = data['stockQty'] as int;
    
    ref.read(flashSaleStockUpdatesProvider.notifier).update((state) {
      return {
        ...state,
        itemId: FlashSaleStockUpdate(soldQty: soldQty, stockQty: stockQty),
      };
    });
  });
});
