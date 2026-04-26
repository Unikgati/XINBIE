import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../providers/cart_provider.dart';

class DgProductBottomSheet extends ConsumerStatefulWidget {
  final Product product;
  final String? initialVariantId;

  const DgProductBottomSheet({
    super.key,
    required this.product,
    this.initialVariantId,
  });

  @override
  ConsumerState<DgProductBottomSheet> createState() => _DgProductBottomSheetState();
}

class _DgProductBottomSheetState extends ConsumerState<DgProductBottomSheet> {
  int _quantity = 1;
  String? _selectedVariantId;

  static final _priceRegex = RegExp(r'(\d)(?=(\d{3})+(?!\d))');

  String _formatNumber(num n) {
    return n.toInt().toString().replaceAllMapped(
          _priceRegex,
          (m) => '${m[1]}.',
        );
  }

  @override
  void initState() {
    super.initState();
    // Pre-fill from cart if exists
    final cart = ref.read(cartProvider);
    final existingItem = cart.where((item) => item.productId == widget.product.id).firstOrNull;
    
    if (existingItem != null) {
      _quantity = existingItem.qty > 0 ? existingItem.qty : 1;
      _selectedVariantId = existingItem.variantId;
    } else {
      _selectedVariantId = widget.initialVariantId;
      if (_selectedVariantId == null && (widget.product.variants?.isNotEmpty ?? false)) {
        _selectedVariantId = widget.product.variants!.first.id;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final variant = p.variants?.where((v) => v.id == _selectedVariantId).firstOrNull;
    
    final int basePrice = variant != null && variant.price > 0 ? variant.price : p.price;
    final int? baseDiscountPrice = variant != null && variant.price > 0 ? variant.discountPrice : p.discountPrice;

    final activePrice = baseDiscountPrice ?? basePrice;
    final hasDiscount = baseDiscountPrice != null && baseDiscountPrice < basePrice;

    int? currentDiscountPercent;
    if (hasDiscount) {
      if (variant != null && variant.price > 0 && variant.discountPrice != null) {
        currentDiscountPercent = ((variant.price - variant.discountPrice!) / variant.price * 100).round();
      } else if (p.discountPercent != null) {
        currentDiscountPercent = p.discountPercent;
      } else if (p.discountPrice != null) {
        currentDiscountPercent = ((p.price - p.discountPrice!) / p.price * 100).round();
      }
    }

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

    final double subtotal = (activePrice * _quantity).toDouble();

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 16),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Info Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Image
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                width: 120,
                                height: 120,
                                color: Colors.grey[100],
                                child: pImageUrl != null
                                    ? CachedNetworkImage(
                                        imageUrl: pImageUrl,
                                        fit: BoxFit.cover,
                                        placeholder: (context, url) => const DgShimmer(),
                                        errorWidget: (context, url, error) => Container(
                                          color: AppColors.background,
                                          child: const Icon(Icons.image_not_supported),
                                        ),
                                      )
                                    : Container(
                                        color: AppColors.background,
                                        child: const Icon(
                                          Icons.shopping_basket_outlined,
                                          size: 48,
                                          color: AppColors.textHint,
                                        ),
                                      ),
                              ),
                            ),
                            if (currentDiscountPercent != null)
                              Positioned(
                                top: 12,
                                left: -6,
                                child: DgDiscountBadge(discountPercent: currentDiscountPercent),
                              ),
                          ],
                        ),
                        const SizedBox(width: 16),
                        // Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                p.name,
                                style: AppTypography.h4.copyWith(
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              if (hasDiscount)
                                Text(
                                  'Rp. ${_formatNumber(p.price)}',
                                  style: AppTypography.bodySmall.copyWith(
                                    decoration: TextDecoration.lineThrough,
                                    decorationColor: AppColors.priceStrikethrough,
                                    color: AppColors.priceStrikethrough,
                                  ),
                                ),
                              Text(
                                'Rp. ${_formatNumber(activePrice)}',
                                style: AppTypography.h2.copyWith(
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  border: Border.all(color: AppColors.border),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  '/${p.unit}',
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Description
                    if (p.description != null && p.description!.isNotEmpty) ...[
                      Text(
                        'Deskripsi',
                        style: AppTypography.h4.copyWith(
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        p.description!,
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Variants
                    if (p.variants != null && p.variants!.isNotEmpty) ...[
                      Text(
                        'Varian',
                        style: AppTypography.h4.copyWith(
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: p.variants!.map((v) {
                          final isSelected = _selectedVariantId == v.id;
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedVariantId = v.id;
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primaryAction.withOpacity(0.1) : Colors.white,
                                border: Border.all(
                                  color: isSelected ? AppColors.primaryAction : AppColors.border,
                                  width: isSelected ? 1.5 : 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    v.name,
                                    style: AppTypography.bodyMedium.copyWith(
                                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                      color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                                    ),
                                  ),
                                  if (v.price > 0) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Rp ${_formatNumber(v.discountPrice ?? v.price)}',
                                      style: AppTypography.caption.copyWith(
                                        color: isSelected ? AppColors.primaryAction : AppColors.textSecondary,
                                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ],
                ),
              ),
            ),

            // Bottom Actions
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: AppColors.divider, width: 1),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      DgQuantitySelector(
                        quantity: _quantity,
                        compact: false,
                        onChanged: (val) {
                          setState(() {
                            _quantity = val;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryAction,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        elevation: 0,
                      ),
                      onPressed: () {
                        // Add to cart logic
                        // In cart_provider, we add the product. We might need to handle variants if cart provider supports it.
                        // Currently, the provider's `addItem` doesn't take variantId, but we can update the quantity directly
                        // using updateQuantity if it's already there, or use addItem.
                        final cartNotifier = ref.read(cartProvider.notifier);
                        final existingIdx = ref.read(cartProvider).indexWhere((item) => 
                            item.productId == p.id && item.variantId == _selectedVariantId);
                        
                        if (existingIdx >= 0) {
                          cartNotifier.updateQuantity(p.id, _quantity, variantId: _selectedVariantId);
                        } else {
                          cartNotifier.addItem(p, quantity: _quantity, variant: variant);
                        }
                        
                        Navigator.of(context).pop();
                      },
                      child: Text(
                        'Tambah ke Cart (Rp. ${_formatNumber(subtotal)})',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
