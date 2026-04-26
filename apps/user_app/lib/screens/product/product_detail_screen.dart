import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/product_provider.dart';
import 'package:intl/intl.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});
  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _qty = 1;
  ProductVariant? _selectedVariant;

  @override
  Widget build(BuildContext context) {
    final asyProduct = ref.watch(productDetailProvider(widget.productId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: asyProduct.when(
        loading: () => DgShimmer.productDetail(),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Gagal memuat produk: $err', textAlign: TextAlign.center),
              TextButton(
                onPressed: () => ref.refresh(productDetailProvider(widget.productId)),
                child: const Text('Coba Lagi'),
              ),
            ],
          )
        ),
        data: (product) {
          final hasVariants = product.variants != null && product.variants!.isNotEmpty;
          
          // Determine active price based on variant or product
          int activePrice = product.price;
          int? activeDiscount = product.discountPrice;
          int activeStock = product.stockQty;

          if (hasVariants) {
            // If variants exist, but none selected yet, pick the first
            _selectedVariant ??= product.variants!.first;
            activePrice = _selectedVariant!.price;
            activeDiscount = _selectedVariant!.discountPrice;
            activeStock = _selectedVariant!.stockQty;
          }

          final sellPrice = activeDiscount ?? activePrice;
          final formatRp = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);

          return CustomScrollView(
            slivers: [
              // Image header
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: product.images.isNotEmpty 
                    ? Image.network(product.images.first, fit: BoxFit.cover)
                    : Container(
                        color: AppColors.background,
                        child: const Center(
                          child: Icon(Icons.inventory_2_outlined, size: 100, color: AppColors.textHint),
                        ),
                      ),
                ),
                leading: _CircleBack(onTap: () => context.pop()),
              ),

              SliverToBoxAdapter(
                child: Container(
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  transform: Matrix4.translationValues(0, -24, 0),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Category badge
                        if (product.categoryName != null)
                          DgBadge(label: product.categoryName!, color: AppColors.primarySurface, textColor: AppColors.primaryDark),
                        const SizedBox(height: 12),

                        // Name
                        Text(product.name, style: AppTypography.h2),
                        const SizedBox(height: 8),

                        // Price
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (activeDiscount != null) ...[
                              Text(formatRp.format(activePrice), style: AppTypography.bodyMedium.copyWith(decoration: TextDecoration.lineThrough, color: AppColors.textHint)),
                              const SizedBox(width: 8),
                            ],
                            Text(formatRp.format(sellPrice), style: AppTypography.priceActive.copyWith(color: AppColors.priceActive, fontSize: 22)),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                border: Border.all(color: AppColors.border),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text('/${product.unit}', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                            ),
                          ],
                        ),
                        
                        // Variants
                        if (hasVariants) ...[
                          const SizedBox(height: 24),
                          Text('Pilih Varian', style: AppTypography.h4),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: product.variants!.map((v) {
                              final isSelected = _selectedVariant?.id == v.id;
                              return GestureDetector(
                                onTap: () => setState(() => _selectedVariant = v),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppColors.primarySurface : AppColors.surface,
                                    border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(v.name, style: AppTypography.bodyMedium.copyWith(
                                    color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  )),
                                ),
                              );
                            }).toList(),
                          )
                        ],

                        const SizedBox(height: 24),

                        // Description
                        if (product.description.isNotEmpty) ...[
                          Text('Deskripsi', style: AppTypography.h4),
                          const SizedBox(height: 8),
                          Text(
                            product.description,
                            style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.6),
                          ),
                          const SizedBox(height: 24),
                        ],
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),

      // Bottom bar
      bottomNavigationBar: asyProduct.maybeWhen(
        data: (product) => Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 8, offset: const Offset(0, -2))],
          ),
          child: SafeArea(
            child: Row(
              children: [
                // Quantity
                DgQuantitySelector(
                  quantity: _qty,
                  min: 1,
                  max: product.isUnlimitedStock ? 99 : (product.variants?.isNotEmpty == true ? _selectedVariant!.stockQty : product.stockQty),
                  onChanged: (v) => setState(() => _qty = v),
                ),
                const SizedBox(width: 16),

                // Add to cart button
                Expanded(
                  child: DgButton(
                    label: 'Tambah ke Keranjang',
                    icon: Icons.shopping_cart_outlined,
                    onPressed: () {
                      DgSnackbar.showSuccess(context, message: '$_qty item ditambahkan ke keranjang');
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        orElse: () => const SizedBox.shrink(),
      ),
    );
  }
}

class _CircleBack extends StatelessWidget {
  const _CircleBack({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
          ),
          child: const Icon(Icons.arrow_back, size: 20),
        ),
      ),
    );
  }
}

class _NutritionChip extends StatelessWidget {
  const _NutritionChip({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(value, style: AppTypography.labelSmall.copyWith(color: color, fontWeight: FontWeight.w700)),
          Text(label, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
