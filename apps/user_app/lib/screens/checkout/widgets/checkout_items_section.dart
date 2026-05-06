import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../providers/cart_provider.dart';

class CheckoutItemsSection extends ConsumerWidget {
  const CheckoutItemsSection({super.key});

  String _formatNumber(num n) {
    return n.toInt().toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartItems = ref.watch(cartProvider);

    return _Section(
      title: 'PESANAN',
      trailing: Text(
        '${cartItems.length} Produk',
        style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark),
      ),
      child: Column(
        children: cartItems.map((item) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
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
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (item.variantName != null && item.variantName!.isNotEmpty)
                        Text(
                          item.variantName!,
                          style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                        ),
                      Text(
                        item.productName ?? 'Produk',
                        style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Rp ${_formatNumber(item.unitPrice ?? 0)}',
                        style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '/${item.unit ?? "item"}',
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('${item.qty}x', style: AppTypography.labelLarge),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.trailing});
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 4)],
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
