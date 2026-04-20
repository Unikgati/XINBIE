import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Shimmer loading placeholder.
class DgShimmer extends StatelessWidget {
  const DgShimmer({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.child,
  });

  final double? width;
  final double? height;
  final double? borderRadius;
  final Widget? child;

  /// Product card shimmer.
  factory DgShimmer.productCard() {
    return DgShimmer(
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.productCardRadius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppSpacing.productCardRadius),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.cardPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 100, height: 14, color: AppColors.background),
                  const SizedBox(height: 8),
                  Container(width: 70, height: 16, color: AppColors.background),
                  const SizedBox(height: 8),
                  Container(width: 50, height: 12, color: AppColors.background),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Product grid shimmer (4 cards).
  factory DgShimmer.productGrid({int count = 4}) {
    return DgShimmer(
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        itemCount: count,
        itemBuilder: (_, __) => DgShimmer.productCard(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.background,
      highlightColor: AppColors.surface,
      child: child ??
          Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius:
                  BorderRadius.circular(borderRadius ?? AppSpacing.radiusSm),
            ),
          ),
    );
  }
}
