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
