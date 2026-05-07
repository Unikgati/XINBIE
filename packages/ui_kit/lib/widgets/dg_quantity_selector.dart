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
    this.enabled = true,
  });

  final int quantity;
  final ValueChanged<int>? onChanged;
  final bool compact;
  final int min;
  final int max;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final size = compact ? 28.0 : 40.0;
    final iconSize = compact ? 16.0 : 24.0;
    final fontSize = compact ? 13.0 : 16.0;

    final canMinus = enabled && quantity > min;
    final canPlus = enabled && quantity < max;
    final isAtMax = quantity >= max && enabled;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Minus Button
        _ControlButton(
          icon: Icons.remove,
          size: size,
          iconSize: iconSize,
          enabled: canMinus,
          onTap: () => onChanged?.call(quantity - 1),
        ),

        SizedBox(width: compact ? 4 : 8),

        // Quantity Display
        Container(
          width: compact ? 32 : 48,
          height: size,
          decoration: BoxDecoration(
            color: enabled ? Colors.transparent : AppColors.border.withValues(alpha: 0.1),
            border: Border.all(
              color: enabled ? AppColors.primary.withValues(alpha: 0.5) : AppColors.border,
              width: 1.5,
            ),
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Center(
            child: Text(
              '$quantity',
              style: AppTypography.labelLarge.copyWith(
                fontSize: fontSize,
                color: enabled ? AppColors.primaryDark : AppColors.textSecondary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),

        SizedBox(width: compact ? 4 : 8),

        // Plus Button
        _ControlButton(
          icon: Icons.add,
          size: size,
          iconSize: iconSize,
          enabled: canPlus,
          onTap: () => onChanged?.call(quantity + 1),
          isAtMax: isAtMax,
        ),
      ],
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.size,
    required this.iconSize,
    required this.enabled,
    required this.onTap,
    this.isAtMax = false,
  });

  final IconData icon;
  final double size;
  final double iconSize;
  final bool enabled;
  final VoidCallback onTap;
  final bool isAtMax;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: enabled 
              ? AppColors.primaryAction 
              : AppColors.border.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          boxShadow: enabled ? [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            )
          ] : null,
        ),
        child: Icon(
          icon, 
          color: enabled ? Colors.white : AppColors.textHint, 
          size: iconSize,
        ),
      ),
    );
  }
}
