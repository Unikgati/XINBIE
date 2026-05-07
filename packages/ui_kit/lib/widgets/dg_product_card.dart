import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'dg_badge.dart';
import 'dg_shimmer.dart';
import 'dg_quantity_selector.dart';
import 'dg_discount_badge.dart';

/// Product card matching DapurGizi UI design.
/// White card, rounded-16, discount badge, unit pill, inline qty selector.
class DgProductCard extends StatelessWidget {
  const DgProductCard({
    super.key,
    required this.name,
    required this.price,
    required this.unit,
    this.imageUrl,
    this.discountPrice,
    this.discountPercent,
    this.quantity = 0,
    this.isOutOfStock = false,
    this.variantCount = 0,
    this.hasMultiplePrices = false,
    this.tags = const [],
    this.onTap,
    this.onAddToCart,
    this.onQuantityChanged,
    this.maxQuantity = 99,
  });

  final String name;
  final int price;
  final String unit;
  final String? imageUrl;
  final int? discountPrice;
  final int? discountPercent;
  final int quantity;
  final bool isOutOfStock;
  final int variantCount;
  final bool hasMultiplePrices;
  final List<String> tags;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final ValueChanged<int>? onQuantityChanged;
  final int maxQuantity;

  int get _displayPrice => discountPrice ?? price;
  bool get _hasDiscount => discountPrice != null && discountPrice! < price;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(AppSpacing.productCardRadius),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppSpacing.productCardRadius),
                  ),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: imageUrl != null
                              ? CachedNetworkImage(
                                  imageUrl: imageUrl!,
                                  fit: BoxFit.cover,
                                  memCacheWidth: 400,
                                  memCacheHeight: 400,
                                  placeholder: (_, __) => const DgShimmer(),
                                  errorWidget: (_, __, ___) => Container(
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
                        if (isOutOfStock)
                          Positioned.fill(
                            child: Container(
                              color: AppColors.outOfStockOverlay,
                              child: Center(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.textSecondary,
                                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                                  ),
                                  child: Text(
                                    'Habis',
                                    style: AppTypography.labelLarge.copyWith(
                                      color: AppColors.textOnPrimary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

                // Info
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.cardPadding),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Name
                        Text(
                          name,
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.primaryDark,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),

                        // Tags
                        if (tags.isNotEmpty) ...[
                          Text(
                            tags.take(3).join(' · ') + (tags.length > 3 ? ' +${tags.length - 3}' : ''),
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                              fontSize: 10,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                        ],

                        // Price
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.end,
                          spacing: 6,
                          children: [
                            Text(
                              'Rp ${_formatNumber(_displayPrice)}',
                              style: AppTypography.labelLarge.copyWith(
                                color: AppColors.primaryDark,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            if (_hasDiscount && !hasMultiplePrices) ...[
                              Padding(
                                padding: const EdgeInsets.only(bottom: 2),
                                child: Text(
                                  'Rp ${_formatNumber(price)}',
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.priceStrikethrough,
                                    decoration: TextDecoration.lineThrough,
                                    decorationColor: AppColors.priceStrikethrough,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),

                        const Spacer(),

                        // Unit badge + quantity selector row
                      Row(
                        children: [
                          // Unit badge
                          Expanded(
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  border: Border.all(color: AppColors.border),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  '/$unit',
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.textSecondary,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Quantity selector or Add button
                          if (!isOutOfStock) ...[
                            if (quantity > 0 && variantCount == 0)
                              DgQuantitySelector(
                                quantity: quantity,
                                onChanged: onQuantityChanged,
                                max: maxQuantity,
                                compact: true,
                              )
                            else
                              _AddButton(onTap: onAddToCart),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                ),
              ],
            ),

            // Discount badge
            if (_hasDiscount && discountPercent != null)
              Positioned(
                top: 12,
                left: -6,
                child: DgDiscountBadge(discountPercent: discountPercent!),
              ),

            // Variant badge at top right
            if (variantCount > 0)
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    '$variantCount Varian',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.primaryDark,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),


          ],
        ),
      ),
    );
  }

  static final _priceRegex = RegExp(r'(\d)(?=(\d{3})+(?!\d))');

  String _formatNumber(int n) {
    return n.toString().replaceAllMapped(
          _priceRegex,
          (m) => '${m[1]}.',
        );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({super.key, this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppColors.primaryAction,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(
          Icons.add,
          color: AppColors.textOnPrimary,
          size: 20,
        ),
      ),
    );
  }
}
