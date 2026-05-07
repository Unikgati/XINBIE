import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
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

  void _addToCart(Product product) {
    final hasVariants = product.variants != null && product.variants!.isNotEmpty;
    if (hasVariants && _selectedVariant == null) {
      DgSnackbar.showError(context, message: 'Pilih varian terlebih dahulu');
      return;
    }
    ref.read(cartProvider.notifier).addItem(
      product,
      quantity: _qty,
      variant: _selectedVariant,
    );
    DgSnackbar.showSuccess(context, message: '$_qty item ditambahkan ke keranjang');
  }

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
            _selectedVariant ??= product.variants!.first;
            activePrice = _selectedVariant!.price;
            activeDiscount = _selectedVariant!.discountPrice;
            activeStock = _selectedVariant!.stockQty;
          }

          // Sync _qty with activeStock
          if (activeStock <= 0 && _qty != 0) {
            Future.microtask(() => setState(() => _qty = 0));
          } else if (activeStock > 0 && _qty == 0) {
            Future.microtask(() => setState(() => _qty = 1));
          } else if (_qty > activeStock && activeStock > 0) {
            Future.microtask(() => setState(() => _qty = activeStock));
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
                    ? Image.network(
                        AppConfig.fixImageUrl(product.images.first),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.background,
                          child: const Center(
                            child: Icon(Icons.broken_image_outlined, size: 80, color: AppColors.textHint),
                          ),
                        ),
                      )
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 36, 20, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        // Category badge
                        if (product.categoryName != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              product.categoryName!,
                              style: AppTypography.caption.copyWith(
                                color: AppColors.primaryDark,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        const SizedBox(height: 10),

                        // Name
                        Text(product.name, style: AppTypography.h2.copyWith(fontSize: 22, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 10),

                        // Price row: big green price + discount badge + strikethrough
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              formatRp.format(sellPrice),
                              style: AppTypography.priceActive.copyWith(
                                color: AppColors.priceActive,
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (activeDiscount != null && product.discountPercent != null) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.error,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${product.discountPercent}% OFF',
                                  style: AppTypography.caption.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                formatRp.format(activePrice),
                                style: AppTypography.bodySmall.copyWith(
                                  decoration: TextDecoration.lineThrough,
                                  decorationColor: AppColors.textHint.withOpacity(0.5),
                                  color: AppColors.textHint.withOpacity(0.5),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Tags as outlined pills
                        if (product.tags.isNotEmpty)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: product.tags.map((tag) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                              decoration: BoxDecoration(
                                border: Border.all(color: AppColors.primary.withOpacity(0.5)),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                tag,
                                style: AppTypography.caption.copyWith(
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            )).toList(),
                          ),

                        const SizedBox(height: 20),
                        const Divider(height: 1),
                        const SizedBox(height: 16),

                        // Info rows: Satuan & Stok
                        _InfoRow(label: 'Satuan', value: '${product.stockQty == 0 && !product.isUnlimitedStock ? '' : ''}1 ${product.unit}'),
                        const SizedBox(height: 10),
                        _InfoRow(
                          label: 'Stok',
                          value: activeStock > 0 ? 'Tersedia' : 'Habis',
                          valueColor: activeStock > 0
                            ? AppColors.primaryDark
                            : AppColors.error,
                        ),
                        if (activeStock > 0 && activeStock <= 10)
                          Padding(
                            padding: const EdgeInsets.only(top: 4, left: 80),
                            child: Text(
                              'Sisa $activeStock item lagi!',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.error,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),

                        // Variants
                        if (hasVariants) ...[
                          const SizedBox(height: 16),
                          const Divider(height: 1),
                          const SizedBox(height: 16),
                          Text(
                            'Pilih Varian:',
                            style: AppTypography.labelLarge.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: product.variants!.map((v) {
                              final isSelected = _selectedVariant?.id == v.id;
                              final hasDiscount = v.discountPrice != null && v.discountPrice! < v.price;
                              return GestureDetector(
                                onTap: () => setState(() => _selectedVariant = v),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: isSelected ? AppColors.primarySurface : AppColors.surface,
                                        border: Border.all(
                                          color: isSelected ? AppColors.primary : AppColors.border,
                                          width: isSelected ? 1.5 : 1,
                                        ),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        v.name,
                                        style: AppTypography.bodyMedium.copyWith(
                                          color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                    // Red discount corner badge (bottom-right)
                                    if (hasDiscount)
                                      Positioned(
                                        bottom: -2,
                                        right: -2,
                                        child: Container(
                                          width: 22,
                                          height: 22,
                                          decoration: const BoxDecoration(
                                            color: AppColors.error,
                                            borderRadius: BorderRadius.only(
                                              topLeft: Radius.circular(6),
                                              bottomRight: Radius.circular(10),
                                            ),
                                          ),
                                          child: const Center(
                                            child: Text(
                                              '%',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // Description
                        if (product.description.isNotEmpty) ...[
                          Text('Deskripsi Produk', style: AppTypography.h4.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          _CollapsibleDescription(content: product.description),
                          const SizedBox(height: 24),
                        ],

                          ],
                        ),
                      ),

                        // Mungkin Kamu Suka
                        if (product.populatedRelatedProducts.isNotEmpty) ...[
                          const Divider(),
                          const SizedBox(height: 16),
                          Text('Mungkin Kamu Suka', style: AppTypography.h4),
                          const SizedBox(height: 12),
                          Consumer(
                            builder: (context, cartRef, _) {
                              final cart = cartRef.watch(cartProvider);
                              return GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                padding: EdgeInsets.zero,
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  childAspectRatio: 0.55,
                                  mainAxisSpacing: 12,
                                  crossAxisSpacing: 12,
                                ),
                                itemCount: product.populatedRelatedProducts.length,
                                itemBuilder: (context, index) {
                                  final p = product.populatedRelatedProducts[index];
                                  final cartIdx = cart.indexWhere((item) => item.productId == p.id);
                                  final currentQty = cartIdx >= 0 ? cart[cartIdx].qty : 0;
                                  return DgProductCard(
                                    name: p.name,
                                    price: p.price,
                                    unit: p.unit,
                                    imageUrl: p.images.isNotEmpty ? AppConfig.fixImageUrl(p.images.first) : null,
                                    discountPrice: p.discountPrice,
                                    discountPercent: p.discountPercent,
                                    isOutOfStock: p.stockQty <= 0,
                                    variantCount: p.variants?.length ?? 0,
                                    hasMultiplePrices: p.hasMultiplePrices,
                                    tags: p.tags,
                                    quantity: currentQty,
                                    maxQuantity: p.stockQty,
                                    onTap: () => context.push('/product/${p.id}'),
                                    onAddToCart: () {
                                      if (p.variants != null && p.variants!.isNotEmpty) {
                                        context.push('/product/${p.id}');
                                      } else {
                                        cartRef.read(cartProvider.notifier).addItem(p);
                                        DgSnackbar.showSuccess(context, message: '1 item ditambahkan ke keranjang');
                                      }
                                    },
                                    onQuantityChanged: (newQty) {
                                      cartRef.read(cartProvider.notifier).updateQuantity(p.id, newQty);
                                    },
                                  );
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 24),
                        ],

                        // Produk Terkait
                        if (product.populatedSimilarProducts.isNotEmpty) ...[
                          const Divider(),
                          const SizedBox(height: 16),
                          Text('Produk Terkait', style: AppTypography.h4),
                          const SizedBox(height: 12),
                          Consumer(
                            builder: (context, cartRef, _) {
                              final cart = cartRef.watch(cartProvider);
                              return GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                padding: EdgeInsets.zero,
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  childAspectRatio: 0.55,
                                  mainAxisSpacing: 12,
                                  crossAxisSpacing: 12,
                                ),
                                itemCount: product.populatedSimilarProducts.length,
                                itemBuilder: (context, index) {
                                  final p = product.populatedSimilarProducts[index];
                                  final cartIdx = cart.indexWhere((item) => item.productId == p.id);
                                  final currentQty = cartIdx >= 0 ? cart[cartIdx].qty : 0;
                                  return DgProductCard(
                                    name: p.name,
                                    price: p.price,
                                    unit: p.unit,
                                    imageUrl: p.images.isNotEmpty ? AppConfig.fixImageUrl(p.images.first) : null,
                                    discountPrice: p.discountPrice,
                                    discountPercent: p.discountPercent,
                                    isOutOfStock: p.stockQty <= 0,
                                    variantCount: p.variants?.length ?? 0,
                                    hasMultiplePrices: p.hasMultiplePrices,
                                    tags: p.tags,
                                    quantity: currentQty,
                                    maxQuantity: p.stockQty,
                                    onTap: () => context.push('/product/${p.id}'),
                                    onAddToCart: () {
                                      if (p.variants != null && p.variants!.isNotEmpty) {
                                        context.push('/product/${p.id}');
                                      } else {
                                        cartRef.read(cartProvider.notifier).addItem(p);
                                        DgSnackbar.showSuccess(context, message: '1 item ditambahkan ke keranjang');
                                      }
                                    },
                                    onQuantityChanged: (newQty) {
                                      cartRef.read(cartProvider.notifier).updateQuantity(p.id, newQty);
                                    },
                                  );
                                },
                              );
                            },
                          ),
                          const SizedBox(height: 24),
                        ],

                        // Inspirasi Masakan (Full Width Section)
                        if (product.cookingVideos.isNotEmpty) ...[
                          const Divider(),
                          const SizedBox(height: 16),
                          Text(
                            'Inspirasi Masakan dari Bahan Ini',
                            style: AppTypography.h4,
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 220,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: product.cookingVideos.length,
                              padding: EdgeInsets.zero,
                              itemBuilder: (context, index) {
                                final video = product.cookingVideos[index];
                                const cardWidth = 280.0;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 16),
                                  child: DgCookingVideoCard(
                                    video: video,
                                    width: cardWidth,
                                    onTap: () {
                                      context.push('/cooking-video', extra: {
                                        'video': video,
                                        'products': video.products,
                                      });
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],


                        const SizedBox(height: 100),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),

      // Bottom bar
      bottomNavigationBar: asyProduct.maybeWhen(
        data: (product) {
          final int basePrice = _selectedVariant?.price ?? product.price;
          final int discountPrice = _selectedVariant?.discountPrice ?? product.discountPrice ?? basePrice;
          final int sellPrice = discountPrice < basePrice ? discountPrice : basePrice;
          final int subtotal = sellPrice * _qty;
          final int activeStock = _selectedVariant?.stockQty ?? product.stockQty;
          final formatRp = NumberFormat.currency(locale: 'id', symbol: 'Rp. ', decimalDigits: 0);

          return Container(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 10, offset: const Offset(0, -4))],
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Sub total:', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                          const SizedBox(height: 4),
                          Text(
                            formatRp.format(subtotal),
                            style: AppTypography.priceActive.copyWith(
                              color: AppColors.priceActive,
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                        DgQuantitySelector(
                          quantity: _qty,
                          min: activeStock > 0 ? 1 : 0,
                          max: activeStock,
                          enabled: activeStock > 0,
                          onChanged: (v) => setState(() => _qty = v),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DgButton(
                          label: activeStock > 0 ? 'Keranjang' : 'Stok Habis',
                          icon: activeStock > 0 ? Icons.add : null,
                          isOutlined: true,
                          onPressed: activeStock > 0 ? () => _addToCart(product) : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DgButton(
                          label: 'Beli Langsung',
                          onPressed: activeStock > 0 ? () {
                            _addToCart(product);
                            context.push('/cart');
                          } : null,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
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

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.valueColor});
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
          ),
        ),
        Text(
          value,
          style: AppTypography.bodyMedium.copyWith(
            color: valueColor ?? AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _CollapsibleDescription extends StatefulWidget {
  const _CollapsibleDescription({required this.content});
  final String content;

  @override
  State<_CollapsibleDescription> createState() => _CollapsibleDescriptionState();
}

class _CollapsibleDescriptionState extends State<_CollapsibleDescription> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 300),
          alignment: Alignment.topCenter,
          child: Container(
            constraints: BoxConstraints(
              maxHeight: _isExpanded ? double.infinity : 150,
            ),
            foregroundDecoration: BoxDecoration(
              gradient: _isExpanded
                  ? null
                  : LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.6, 1.0],
                      colors: [
                        AppColors.surface.withOpacity(0.0),
                        AppColors.surface,
                      ],
                    ),
            ),
            child: ClipRect(
              child: SingleChildScrollView(
                physics: const NeverScrollableScrollPhysics(),
                child: Text(
                  widget.content,
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.6,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: TextButton.icon(
            onPressed: () => setState(() => _isExpanded = !_isExpanded),
            icon: Icon(_isExpanded ? Icons.expand_less : Icons.expand_more, color: AppColors.primary, size: 20),
            label: Text(
              _isExpanded ? 'Tutup Deskripsi' : 'Baca Selengkapnya',
              style: AppTypography.labelLarge.copyWith(color: AppColors.primary),
            ),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
        ),
      ],
    );
  }
}
