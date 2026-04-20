import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Primary action button (green, rounded).
class DgButton extends StatelessWidget {
  const DgButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isOutlined = false,
    this.isFullWidth = true,
    this.size = DgButtonSize.medium,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isOutlined;
  final bool isFullWidth;
  final DgButtonSize size;

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.textOnPrimary,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: size == DgButtonSize.small ? 16 : 20),
                const SizedBox(width: 8),
              ],
              Text(label),
            ],
          );

    final button = isOutlined
        ? OutlinedButton(
            onPressed: isLoading ? null : onPressed,
            style: OutlinedButton.styleFrom(
              padding: _padding,
              minimumSize: Size(0, _height),
            ),
            child: child,
          )
        : ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              padding: _padding,
              minimumSize: Size(0, _height),
            ),
            child: child,
          );

    return isFullWidth
        ? SizedBox(width: double.infinity, child: button)
        : button;
  }

  EdgeInsets get _padding {
    switch (size) {
      case DgButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case DgButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 14);
      case DgButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 18);
    }
  }

  double get _height {
    switch (size) {
      case DgButtonSize.small:
        return 36;
      case DgButtonSize.medium:
        return 48;
      case DgButtonSize.large:
        return 56;
    }
  }
}

enum DgButtonSize { small, medium, large }
