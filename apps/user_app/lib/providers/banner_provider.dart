import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Provider for fetching banners
final bannersProvider = FutureProvider<List<BannerModel>>((ref) async {
  final repository = ref.watch(bannerRepositoryProvider);
  return repository.getBanners();
});

/// Provider for specifically filtering Promo banners (now showing ALL banners)
final promoBannersProvider = Provider<AsyncValue<List<BannerModel>>>((ref) {
  final bannersAsync = ref.watch(bannersProvider);
  return bannersAsync.whenData((banners) {
    return banners.toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  });
});
