import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'dg_badge.dart';
import 'dg_quantity_selector.dart';

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
    this.onTap,
    this.onAddToCart,
    this.onQuantityChanged,
  });

  final String name;
  final int price;
  final String unit;
  final String? imageUrl;
  final int? discountPrice;
  final int? discountPercent;
  final int quantity;
  final bool isOutOfStock;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final ValueChanged<int>? onQuantityChanged;

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
                    child: imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: imageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                              color: AppColors.background,
                            ),
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
                ),

                // Info
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.cardPadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name
                      Text(
                        name,
                        style: AppTypography.labelLarge.copyWith(
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),

                      // Price
                      if (_hasDiscount) ...[
                        Text(
                          'Rp ${_formatNumber(price)}',
                          style: AppTypography.priceStrikethrough.copyWith(
                            color: AppColors.priceStrikethrough,
                          ),
                        ),
                      ],
                      Text(
                        'Rp ${_formatNumber(_displayPrice)}',
                        style: AppTypography.priceActive.copyWith(
                          color: AppColors.priceActive,
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Unit badge + quantity selector row
                      Row(
                        children: [
                          // Unit badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.border),
                              borderRadius:
                                  BorderRadius.circular(AppSpacing.radiusSm),
                            ),
                            child: Text(
                              '/$unit',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          const Spacer(),

                          // Quantity selector or Add button
                          if (!isOutOfStock) ...[
                            if (quantity > 0)
                              DgQuantitySelector(
                                quantity: quantity,
                                onChanged: onQuantityChanged,
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
              ],
            ),

            // Discount badge
            if (_hasDiscount && discountPercent != null)
              Positioned(
                top: 8,
                right: 8,
                child: DgBadge(
                  label: '-$discountPercent%',
                  color: AppColors.discountBadge,
                ),
              ),

            // Out of stock overlay
            if (isOutOfStock)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.outOfStockOverlay,
                    borderRadius:
                        BorderRadius.circular(AppSpacing.productCardRadius),
                  ),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.textSecondary,
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusSm),
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
    );
  }

  String _formatNumber(int n) {
    return n.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: const BoxDecoration(
          color: AppColors.primary,
          shape: BoxShape.circle,
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
