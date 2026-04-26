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
    final size = compact ? 32.0 : 40.0;
    final iconSize = compact ? 20.0 : 24.0;
    final fontSize = compact ? 14.0 : 16.0;

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
              color: AppColors.primaryAction,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(Icons.remove, color: AppColors.textOnPrimary, size: iconSize),
          ),
        ),

        const SizedBox(width: 4),

        // Quantity
        Container(
          width: compact ? 28 : 40,
          height: size,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.primaryAction, width: 1.5),
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Center(
            child: Text(
              '$quantity',
              style: AppTypography.labelLarge.copyWith(
                fontSize: fontSize,
                color: AppColors.primaryDark,
              ),
            ),
          ),
        ),

        const SizedBox(width: 4),

        // Plus
        GestureDetector(
          onTap: quantity < max ? () => onChanged?.call(quantity + 1) : null,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: AppColors.primaryAction,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(Icons.add, color: AppColors.textOnPrimary, size: iconSize),
          ),
        ),
      ],
    );
  }
}
