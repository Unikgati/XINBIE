import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/cart_provider.dart';
import 'widgets/dg_cart_item_card.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  String _formatNumber(num n) {
    return n.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only watch length to decide on Empty State vs List
    final cartLength = ref.watch(cartProvider.select((cart) => cart.length));
    final cartNotifier = ref.read(cartProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Cart',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: cartLength == 0
          ? const DgEmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Keranjang Kosong',
              subtitle: 'Yuk mulai belanja bahan dapur sehat!',
              actionLabel: 'Belanja Sekarang',
            )
          : Column(
              children: [
                // Header (Jumlah Produk & Clear All)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '$cartLength Produk',
                        style: AppTypography.labelLarge.copyWith(
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          cartNotifier.clear();
                        },
                        child: Text(
                          'Clear All',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.error,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Cart Items List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    itemCount: cartLength,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      return Consumer(
                        builder: (context, ref, _) {
                          // Watch only this specific item
                          final item = ref.watch(cartProvider.select((cart) => cart[index]));
                          return DgCartItemCard(
                            item: item,
                            onQuantityChanged: (newQty) {
                              cartNotifier.updateQuantity(
                                item.productId,
                                newQty,
                                variantId: item.variantId,
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),

      // Bottom checkout bar
      bottomNavigationBar: cartLength == 0
          ? null
          : RepaintBoundary(
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.shadow.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    )
                  ],
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      Expanded(
                        child: Consumer(
                          builder: (context, ref, _) {
                            final subtotal = ref.watch(cartSubtotalProvider);
                            return Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Grand Total',
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.primaryDark,
                                  ),
                                ),
                                Text(
                                  'Rp. ${_formatNumber(subtotal)}',
                                  style: AppTypography.h3.copyWith(
                                    color: AppColors.primaryDark,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      DgButton(
                        label: 'Checkout',
                        isFullWidth: false,
                        onPressed: () => context.push('/checkout'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
