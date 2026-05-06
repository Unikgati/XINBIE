import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class DgCartItemCard extends StatelessWidget {
  final CartItem item;
  final ValueChanged<int> onQuantityChanged;

  const DgCartItemCard({
    super.key,
    required this.item,
    required this.onQuantityChanged,
  });

  String _formatNumber(int n) {
    return n.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 80,
              height: 80,
              color: AppColors.background,
              child: item.productImage != null
                  ? CachedNetworkImage(
                      imageUrl: AppConfig.fixImageUrl(item.productImage),
                      fit: BoxFit.cover,
                      placeholder: (_, __) => const Center(
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      ),
                      errorWidget: (_, __, ___) => const Icon(
                        Icons.image_not_supported,
                        color: AppColors.textHint,
                      ),
                    )
                  : const Icon(
                      Icons.shopping_basket_outlined,
                      color: AppColors.textHint,
                      size: 32,
                    ),
            ),
          ),
          const SizedBox(width: 16),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Variant Name (if any)
                if (item.variantName != null && item.variantName!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Text(
                      item.variantName!,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                // Product Name
                Text(
                  item.productName ?? 'Produk',
                  style: AppTypography.labelLarge.copyWith(
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),

                // Price
                Text(
                  'Rp ${_formatNumber(item.unitPrice ?? 0)}',
                  style: AppTypography.labelLarge.copyWith(
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),

                // Bottom row: Unit and Quantity Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Unit Badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        '/${item.unit ?? 'pcs'}',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),

                    // Quantity Selector
                    DgQuantitySelector(
                      quantity: item.qty,
                      onChanged: onQuantityChanged,
                      compact: true,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
