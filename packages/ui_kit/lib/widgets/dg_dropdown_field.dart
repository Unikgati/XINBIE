import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

/// A styled dropdown field that matches DapurGizi TextFormField appearance.
///
/// Uses a custom overlay popup with consistent shadow styling.
class DgDropdownField<T> extends StatefulWidget {
  const DgDropdownField({
    super.key,
    required this.items,
    required this.value,
    required this.onChanged,
    this.labelBuilder,
    this.iconBuilder,
    this.hintText = 'Pilih opsi',
    this.prefixIcon,
    this.validator,
    this.enabled = true,
  });

  final List<T> items;
  final T? value;
  final ValueChanged<T?> onChanged;
  final String Function(T item)? labelBuilder;
  final IconData Function(T? item)? iconBuilder;
  final String hintText;
  final IconData? prefixIcon;
  final String? Function(T?)? validator;
  final bool enabled;

  @override
  State<DgDropdownField<T>> createState() => _DgDropdownFieldState<T>();
}

class _DgDropdownFieldState<T> extends State<DgDropdownField<T>>
    with SingleTickerProviderStateMixin {
  final LayerLink _layerLink = LayerLink();
  final GlobalKey _fieldKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  bool _isOpen = false;

  String _label(T item) => widget.labelBuilder?.call(item) ?? item.toString();

  IconData? _resolveIcon() {
    if (widget.iconBuilder != null) return widget.iconBuilder!(widget.value);
    return widget.prefixIcon;
  }

  void _toggleDropdown() {
    if (_isOpen) {
      _closeDropdown();
    } else {
      _openDropdown();
    }
  }

  void _openDropdown() {
    final renderBox = _fieldKey.currentContext!.findRenderObject() as RenderBox;
    final size = renderBox.size;

    _overlayEntry = OverlayEntry(
      builder: (context) => Stack(
        children: [
          // Tap-away barrier
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: _closeDropdown,
              child: const SizedBox.expand(),
            ),
          ),
          // Dropdown popup
          CompositedTransformFollower(
            link: _layerLink,
            offset: Offset(0, size.height + 6),
            showWhenUnlinked: false,
            child: Material(
              color: Colors.transparent,
              child: Container(
                width: size.width,
                constraints: BoxConstraints(maxHeight: 240),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: widget.items.map((item) {
                        final isSelected = item == widget.value;
                        return InkWell(
                          onTap: () {
                            widget.onChanged(item);
                            _closeDropdown();
                          },
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            color: isSelected ? AppColors.primary.withValues(alpha: 0.06) : null,
                            child: Row(
                              children: [
                                if (widget.iconBuilder != null) ...[
                                  Icon(
                                    widget.iconBuilder!(item),
                                    size: 20,
                                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 12),
                                ],
                                Expanded(
                                  child: Text(
                                    _label(item),
                                    style: AppTypography.bodyMedium.copyWith(
                                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                    ),
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(Icons.check_rounded, size: 20, color: AppColors.primary),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
    setState(() => _isOpen = true);
  }

  void _closeDropdown() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    if (mounted) setState(() => _isOpen = false);
  }

  @override
  void dispose() {
    _closeDropdown();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FormField<T>(
      initialValue: widget.value,
      validator: widget.validator,
      builder: (state) {
        final hasError = state.hasError;
        final selectedValue = widget.value;
        final resolvedIcon = _resolveIcon();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            CompositedTransformTarget(
              link: _layerLink,
              child: GestureDetector(
                key: _fieldKey,
                onTap: widget.enabled
                    ? () {
                        _toggleDropdown();
                        if (!_isOpen) state.didChange(widget.value);
                      }
                    : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: widget.enabled
                        ? AppColors.background
                        : AppColors.background.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    border: hasError
                        ? Border.all(color: AppColors.error)
                        : _isOpen
                            ? Border.all(color: AppColors.primary, width: 1.5)
                            : null,
                  ),
                  child: Row(
                    children: [
                      if (resolvedIcon != null) ...[
                        Icon(resolvedIcon, size: 20, color: AppColors.textSecondary),
                        const SizedBox(width: 12),
                      ],
                      Expanded(
                        child: Text(
                          selectedValue != null ? _label(selectedValue as T) : widget.hintText,
                          style: selectedValue != null
                              ? AppTypography.bodyMedium
                              : AppTypography.bodyMedium.copyWith(color: AppColors.textHint),
                        ),
                      ),
                      AnimatedRotation(
                        turns: _isOpen ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: _isOpen ? AppColors.primary : AppColors.textSecondary,
                          size: 22,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (hasError)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 16),
                child: Text(
                  state.errorText!,
                  style: AppTypography.caption.copyWith(color: AppColors.error),
                ),
              ),
          ],
        );
      },
    );
  }
}
