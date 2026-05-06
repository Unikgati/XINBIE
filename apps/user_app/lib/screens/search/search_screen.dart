import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:async';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/dg_product_bottom_sheet.dart';
import 'package:core/core.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() => _query = value);
      }
    });
  }

  Widget _buildProductCard(Product p, List<CartItem> cart) {
    String? pImageUrl = p.images.isNotEmpty ? p.images.first : null;
    if (pImageUrl != null) {
      if (pImageUrl.startsWith('/')) {
        final baseUrl = AppConfig.apiBaseUrl.replaceAll('/api', '');
        pImageUrl = '$baseUrl$pImageUrl';
      }
      if (defaultTargetPlatform == TargetPlatform.android && pImageUrl.contains('localhost')) {
        pImageUrl = pImageUrl.replaceAll('localhost', '10.0.2.2');
      }
    }
    
    final cartItemIdx = cart.indexWhere((item) => item.productId == p.id);
    final currentQty = cartItemIdx >= 0 ? cart[cartItemIdx].qty : 0;

    return DgProductCard(
      name: p.name,
      price: p.displayPrice,
      unit: p.unit,
      discountPrice: p.displayDiscountPrice,
      discountPercent: p.discountPercent,
      variantCount: p.variants?.length ?? 0,
      hasMultiplePrices: p.hasMultiplePrices,
      quantity: currentQty,
      isOutOfStock: !p.isUnlimitedStock && p.stockQty <= 0,
      imageUrl: pImageUrl,
      tags: p.tags,
      onTap: () {
        context.push('/product/${p.id}');
      },
      onAddToCart: () {
        if (p.variants != null && p.variants!.isNotEmpty) {
          context.push('/product/${p.id}');
        } else {
          ref.read(cartProvider.notifier).addItem(p);
        }
      },
      onQuantityChanged: (newQty) {
        ref.read(cartProvider.notifier).updateQuantity(p.id, newQty);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasQuery = _query.trim().isNotEmpty;
    final cart = ref.watch(cartProvider);
    final totalCartItems = ref.watch(cartItemCountProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(right: 16),
          child: DgSearchBar(
            controller: _searchController,
            autofocus: true,
            hintText: 'Cari sayur, buah, bumbu...',
            onChanged: _onSearchChanged,
          ),
        ),
      ),
      body: !hasQuery
          ? const Center(
              child: DgEmptyState(
                icon: Icons.search,
                title: 'Mau masak apa hari ini?',
                subtitle: 'Ketik nama produk, sayur, atau bahan masakan yang Anda butuhkan.',
              ),
            )
          : Consumer(
              builder: (context, ref, child) {
                final searchAsync = ref.watch(productSearchProvider(_query));

                return searchAsync.when(
                  loading: () => Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: DgShimmer.productGrid(count: 6),
                  ),
                  error: (e, _) => Center(
                    child: DgEmptyState(
                      icon: Icons.error_outline,
                      title: 'Pencarian Gagal',
                      subtitle: 'Terjadi kesalahan saat mencari produk. $e',
                    ),
                  ),
                  data: (products) {
                    if (products.isEmpty) {
                      return const Center(
                        child: DgEmptyState(
                          icon: Icons.search_off,
                          title: 'Produk tidak ditemukan',
                          subtitle: 'Coba gunakan kata kunci lain.',
                        ),
                      );
                    }

                    return GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.52,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                      ),
                      itemCount: products.length,
                      itemBuilder: (context, index) {
                        return _buildProductCard(products[index], cart);
                      },
                    );
                  },
                );
              },
            ),
      floatingActionButton: totalCartItems > 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/cart'),
              backgroundColor: AppColors.primaryAction,
              elevation: 0,
              highlightElevation: 0,
              hoverElevation: 0,
              focusElevation: 0,
              icon: Badge(
                isLabelVisible: totalCartItems > 0,
                label: Text(
                  totalCartItems > 9 ? '9+' : totalCartItems.toString(),
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                ),
                backgroundColor: AppColors.cartBadge,
                textColor: Colors.white,
                child: const Icon(Icons.shopping_cart_outlined, color: AppColors.textOnPrimary),
              ),
              label: Text(
                'Cart',
                style: AppTypography.labelLarge.copyWith(color: AppColors.textOnPrimary),
              ),
            )
          : null,
    );
  }
}
