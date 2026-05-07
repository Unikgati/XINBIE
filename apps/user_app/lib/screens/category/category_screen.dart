import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/dg_product_bottom_sheet.dart';

class CategoryScreen extends ConsumerStatefulWidget {
  const CategoryScreen({super.key, required this.categoryId, required this.categoryName});
  final String categoryId;
  final String categoryName;

  @override
  ConsumerState<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends ConsumerState<CategoryScreen> {

  @override
  Widget build(BuildContext context) {
    final totalCartItems = ref.watch(cartItemCountProvider);

    // Fetch real data from backend
    final productsAsync = ref.watch(productsByCategoryProvider(widget.categoryId));
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          widget.categoryName,
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
        iconTheme: const IconThemeData(color: AppColors.textSecondary),
      ),
      body: Column(
        children: [
          RepaintBoundary(
            child: SizedBox(
              height: 52,
              child: categoriesAsync.when(
                data: (categories) {
                  return ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final cat = categories[index];
                      final isSelected = cat.id == widget.categoryId;
                      return _CategoryShortcutChip(
                        label: cat.name, 
                        isSelected: isSelected, 
                        onTap: () {
                          if (!isSelected) {
                            context.pushReplacement('/category/${cat.id}?name=${Uri.encodeComponent(cat.name)}');
                          }
                        }
                      );
                    },
                  );
                },
                loading: () => DgShimmer.categoryList(),
                error: (e, st) => const Center(child: Text('Gagal memuat kategori')),
              ),
            ),
          ),

          // Product grid (Real Data)
          Expanded(
            child: productsAsync.when(
              data: (products) {
                if (products.isEmpty) {
                  return const DgEmptyState(
                    title: 'Kategori Kosong',
                    subtitle: 'Belum ada produk untuk kategori ini.',
                    icon: Icons.inventory_2_outlined,
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.55,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                  ),
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    final p = products[index];
                    
                    return Consumer(
                      builder: (context, ref, _) {
                        // Watch only quantity for THIS specific product
                        final quantity = ref.watch(cartProvider.select((cart) {
                          final item = cart.firstWhere(
                            (item) => item.productId == p.id,
                            orElse: () => CartItem(productId: '', productName: '', qty: 0, unitPrice: 0, unit: ''),
                          );
                          return item.qty;
                        }));

                        return DgProductCard(
                          name: p.name,
                          price: p.displayPrice,
                          discountPrice: p.displayDiscountPrice,
                          discountPercent: p.discountPercent,
                          unit: p.unit,
                          quantity: quantity,
                          isOutOfStock: p.stockQty <= 0,
                          maxQuantity: p.stockQty,
                          variantCount: p.variants?.length ?? 0,
                          hasMultiplePrices: p.hasMultiplePrices,
                          imageUrl: AppConfig.fixImageUrl(p.images.firstOrNull),
                          tags: p.tags,
                          onTap: () => context.push('/product/${p.id}'),
                          onAddToCart: () {
                            if (p.variants != null && p.variants!.isNotEmpty) {
                              context.push('/product/${p.id}');
                            } else {
                              ref.read(cartProvider.notifier).addItem(p);
                              DgSnackbar.showSuccess(context, message: '${p.name} ditambah ke keranjang');
                            }
                          },
                          onQuantityChanged: (newQty) {
                            ref.read(cartProvider.notifier).updateQuantity(p.id, newQty);
                          },
                        );
                      },
                    );
                  },
                );
              },
              loading: () => DgShimmer.productGrid(count: 6),
              error: (e, st) => Center(child: Text('Gagal memuat produk: $e')),
            ),
          ),
        ],
      ),
      floatingActionButton: totalCartItems > 0
          ? RepaintBoundary(
              child: FloatingActionButton.extended(
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
              ),
            )
          : null,
    );
  }
}

class _CategoryShortcutChip extends StatelessWidget {
  const _CategoryShortcutChip({required this.label, required this.isSelected, required this.onTap});
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: DgCategoryChip(label: label, isSelected: isSelected, onTap: onTap),
    );
  }
}
