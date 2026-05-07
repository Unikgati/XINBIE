import 'package:flutter/material.dart';
import 'package:core/core.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'dg_button.dart';
import 'dg_quantity_selector.dart';

class DgVariantBottomSheet extends StatefulWidget {
  const DgVariantBottomSheet({
    super.key,
    required this.product,
    this.initialVariant,
    this.onCompleted,
  });

  final Product product;
  final ProductVariant? initialVariant;
  final Function(ProductVariant selectedVariant, int quantity)? onCompleted;

  @override
  State<DgVariantBottomSheet> createState() => _DgVariantBottomSheetState();

  static Future<void> show(
    BuildContext context, {
    required Product product,
    ProductVariant? initialVariant,
    Function(ProductVariant selectedVariant, int quantity)? onCompleted,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DgVariantBottomSheet(
        product: product,
        initialVariant: initialVariant,
        onCompleted: onCompleted,
      ),
    );
  }
}

class _DgVariantBottomSheetState extends State<DgVariantBottomSheet> {
  ProductVariant? _selectedVariant;
  int _qty = 1;

  @override
  void initState() {
    super.initState();
    _selectedVariant = widget.initialVariant ?? (widget.product.variants?.isNotEmpty == true ? widget.product.variants!.first : null);
  }

  @override
  Widget build(BuildContext context) {
    final activePrice = _selectedVariant?.discountPrice ?? _selectedVariant?.price ?? widget.product.price;
    final activeStock = _selectedVariant?.stockQty ?? widget.product.stockQty;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 20,
        right: 20,
        top: 12,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header Info
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 80,
                  height: 80,
                  child: widget.product.images.isNotEmpty
                      ? Image.network(
                          AppConfig.fixImageUrl(widget.product.images.first),
                          fit: BoxFit.cover,
                        )
                      : Container(color: AppColors.background),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.product.name,
                      style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      CurrencyFormatter.format(activePrice.toInt()),
                      style: AppTypography.priceActive.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Stok: ${activeStock > 0 ? activeStock : 'Habis'}',
                      style: AppTypography.caption.copyWith(
                        color: activeStock > 0 ? AppColors.textSecondary : AppColors.error,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Variants Wrap
          if (widget.product.variants != null && widget.product.variants!.isNotEmpty) ...[
            Text('Pilih Varian', style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 10,
              children: widget.product.variants!.map((v) {
                final isSelected = _selectedVariant?.id == v.id;
                final isOutOfStock = v.stockQty <= 0;
                
                return GestureDetector(
                  onTap: isOutOfStock ? null : () => setState(() => _selectedVariant = v),
                  child: Opacity(
                    opacity: isOutOfStock ? 0.5 : 1.0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primarySurface : AppColors.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.border,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Text(
                        v.name,
                        style: AppTypography.bodyMedium.copyWith(
                          color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          decoration: isOutOfStock ? TextDecoration.lineThrough : null,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],

          // Quantity Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Jumlah', style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700)),
              DgQuantitySelector(
                quantity: _qty,
                max: activeStock,
                min: activeStock > 0 ? 1 : 0,
                onChanged: (val) => setState(() => _qty = val),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Action Button
          DgButton(
            label: activeStock > 0 ? 'Masukkan Keranjang' : 'Stok Habis',
            onPressed: activeStock > 0 && _selectedVariant != null
                ? () {
                    widget.onCompleted?.call(_selectedVariant!, _qty);
                    Navigator.pop(context);
                  }
                : null,
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}
