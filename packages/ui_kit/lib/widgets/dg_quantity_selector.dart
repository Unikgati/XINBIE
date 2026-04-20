import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Inline quantity selector: [-] n [+]
class DgQuantitySelector extends StatelessWidget {
  const DgQuantitySelector({
    super.key,
    required this.quantity,
    this.onChanged,
    this.compact = false,
    this.min = 0,
    this.max = 99,
  });

  final int quantity;
  final ValueChanged<int>? onChanged;
  final bool compact;
  final int min;
  final int max;

  @override
  Widget build(BuildContext context) {
    final size = compact ? 28.0 : 36.0;
    final iconSize = compact ? 16.0 : 20.0;
    final fontSize = compact ? 13.0 : 15.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Minus
        GestureDetector(
          onTap: quantity > min ? () => onChanged?.call(quantity - 1) : null,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(Icons.remove, color: AppColors.textOnPrimary, size: iconSize),
          ),
        ),

        // Quantity
        SizedBox(
          width: compact ? 32 : 40,
          child: Center(
            child: Text(
              '$quantity',
              style: AppTypography.labelLarge.copyWith(fontSize: fontSize),
            ),
          ),
        ),

        // Plus
        GestureDetector(
          onTap: quantity < max ? () => onChanged?.call(quantity + 1) : null,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(Icons.add, color: AppColors.textOnPrimary, size: iconSize),
          ),
        ),
      ],
    );
  }
}
