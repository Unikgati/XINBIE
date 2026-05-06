import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'dg_shimmer.dart';
import 'dg_quantity_selector.dart';

import 'dg_discount_badge.dart';

/// A horizontal product card for list-like displays (e.g. ingredients in video player).
/// Image on the left, info on the right.
class DgProductCardHorizontal extends StatelessWidget {
  const DgProductCardHorizontal({
    super.key,
    required this.name,
    required this.price,
    required this.unit,
    this.imageUrl,
    this.discountPrice,
    this.discountPercent,
    this.tags = const [],
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
  final List<String> tags;
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
        height: 120, // Increased height for tags
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Row(
              children: [
                // Image
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                  child: SizedBox(
                    width: 120,
                    height: 120,
                    child: imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: imageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const DgShimmer(),
                            errorWidget: (_, __, ___) => Container(
                              color: AppColors.background,
                              child: const Icon(Icons.image_not_supported),
                            ),
                          )
                        : Container(
                            color: AppColors.background,
                            child: const Icon(Icons.shopping_basket_outlined, color: AppColors.textHint),
                          ),
                  ),
                ),

                // Info
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.primaryDark,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Rp ${_formatNumber(_displayPrice)}',
                              style: AppTypography.bodyMedium.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '/ $unit',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.textSecondary,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),

                        // Tags
                        if (tags.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            tags.take(3).join(' · ') + (tags.length > 3 ? ' +${tags.length - 3}' : ''),
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                              fontSize: 10,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        
                        const Spacer(),
                        
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (isOutOfStock)
                              Text(
                                'Habis',
                                style: AppTypography.caption.copyWith(color: AppColors.error),
                              )
                            else if (quantity > 0)
                              DgQuantitySelector(
                                quantity: quantity,
                                onChanged: onQuantityChanged,
                                compact: true,
                              )
                            else
                              GestureDetector(
                                onTap: onAddToCart,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryAction,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.add, color: Colors.white, size: 14),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Beli',
                                        style: AppTypography.caption.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Discount Badge (Pita Lipat)
            if (_hasDiscount && discountPercent != null)
              Positioned(
                top: 8,
                left: -6,
                child: DgDiscountBadge(discountPercent: discountPercent!),
              ),
          ],
        ),
      ),
    );
  }

  static final _priceRegex = RegExp(r'(\d)(?=(\d{3})+(?!\d))');
  String _formatNumber(int n) {
    return n.toString().replaceAllMapped(_priceRegex, (m) => '${m[1]}.');
  }
}
