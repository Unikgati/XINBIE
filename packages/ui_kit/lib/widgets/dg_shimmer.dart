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
    this.isCircle = false,
    this.child,
  });

  final double? width;
  final double? height;
  final double? borderRadius;
  final bool isCircle;
  final Widget? child;

  /// Product card shimmer.
  factory DgShimmer.productCard() {
    return DgShimmer(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.productCardRadius),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
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

  /// Category list shimmer.
  factory DgShimmer.categoryList({int count = 8}) {
    return DgShimmer(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final itemWidth = constraints.maxWidth / 4;
          return Wrap(
            runSpacing: 16,
            children: List.generate(count, (_) {
              return SizedBox(
                width: itemWidth,
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Column(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(width: 48, height: 12, color: AppColors.background),
                    ],
                  ),
                ),
              );
            }),
          );
        },
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
          childAspectRatio: 0.62,
          mainAxisSpacing: 12,

          crossAxisSpacing: 12,
        ),
        itemCount: count,
        itemBuilder: (_, __) => DgShimmer.productCard(),
      ),
    );
  }

  /// Banner shimmer
  factory DgShimmer.banner({double height = 140}) {
    return DgShimmer(
      child: Container(
        height: height,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }

  /// Profile page shimmer
  factory DgShimmer.profile() {
    return DgShimmer(
      child: Column(
        children: [
          const SizedBox(height: 32),
          Container(
            width: 100,
            height: 100,
            decoration: const BoxDecoration(
              color: AppColors.background,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(height: 16),
          Container(width: 150, height: 24, color: AppColors.background),
          const SizedBox(height: 8),
          Container(width: 100, height: 16, color: AppColors.background),
          const SizedBox(height: 32),
          ...List.generate(4, (index) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                Container(width: 24, height: 24, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 16),
                Expanded(child: Container(height: 16, color: AppColors.background)),
                const SizedBox(width: 16),
                Container(width: 24, height: 24, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(4))),
              ],
            ),
          )),
        ],
      ),
    );
  }

  /// Address list shimmer
  factory DgShimmer.addressList({int count = 3}) {
    return DgShimmer(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(width: 100, height: 20, color: AppColors.background),
              const SizedBox(height: 8),
              Container(width: double.infinity, height: 14, color: AppColors.background),
              const SizedBox(height: 4),
              Container(width: 200, height: 14, color: AppColors.background),
              const SizedBox(height: 12),
              Divider(color: Colors.grey.withValues(alpha: 0.1), height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(width: 18, height: 18, color: AppColors.background),
                  const SizedBox(width: 8),
                  Container(width: 150, height: 16, color: AppColors.background),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Voucher list shimmer
  factory DgShimmer.voucherList({int count = 3}) {
    return DgShimmer(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Container(
          height: 110,
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  /// Notification list shimmer
  factory DgShimmer.notificationList({int count = 5}) {
    return DgShimmer(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 150, height: 16, color: AppColors.background),
                    const SizedBox(height: 8),
                    Container(width: double.infinity, height: 14, color: AppColors.background),
                    const SizedBox(height: 4),
                    Container(width: 200, height: 14, color: AppColors.background),
                    const SizedBox(height: 8),
                    Container(width: 80, height: 12, color: AppColors.background),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Order detail shimmer
  factory DgShimmer.orderDetail() {
    return DgShimmer(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(width: double.infinity, height: 100, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16))),
            const SizedBox(height: 16),
            Container(width: double.infinity, height: 100, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16))),
            const SizedBox(height: 16),
            Container(width: double.infinity, height: 150, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16))),
            const SizedBox(height: 16),
            Container(width: double.infinity, height: 250, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16))),
          ],
        ),
      ),
    );
  }

  /// Order list shimmer
  factory DgShimmer.orderList({int count = 3}) {
    return DgShimmer(
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(width: 100, height: 14, color: AppColors.background),
                  Container(width: 80, height: 24, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12))),
                ],
              ),
              const SizedBox(height: 12),
              Divider(color: Colors.grey.withValues(alpha: 0.1), height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(width: 60, height: 60, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8))),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(width: 150, height: 16, color: AppColors.background),
                        const SizedBox(height: 8),
                        Container(width: 100, height: 14, color: AppColors.background),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Divider(color: Colors.grey.withValues(alpha: 0.1), height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(width: 80, height: 14, color: AppColors.background),
                  Container(width: 120, height: 18, color: AppColors.background),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Product Detail shimmer
  factory DgShimmer.productDetail() {
    return DgShimmer(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Container(width: double.infinity, height: 350, color: AppColors.background),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 200, height: 28, color: AppColors.background),
                  const SizedBox(height: 16),
                  Container(width: 150, height: 24, color: AppColors.background),
                  const SizedBox(height: 32),
                  Container(width: 120, height: 20, color: AppColors.background),
                  const SizedBox(height: 16),
                  Container(width: double.infinity, height: 14, color: AppColors.background),
                  const SizedBox(height: 8),
                  Container(width: double.infinity, height: 14, color: AppColors.background),
                  const SizedBox(height: 8),
                  Container(width: double.infinity, height: 14, color: AppColors.background),
                  const SizedBox(height: 8),
                  Container(width: 200, height: 14, color: AppColors.background),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Checkout address shimmer
  factory DgShimmer.checkoutAddress() {
    return DgShimmer(
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12))),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 150, height: 16, color: AppColors.background),
                    const SizedBox(height: 8),
                    Container(width: double.infinity, height: 14, color: AppColors.background),
                    const SizedBox(height: 4),
                    Container(width: double.infinity, height: 14, color: AppColors.background),
                    const SizedBox(height: 12),
                    Divider(color: Colors.grey.withValues(alpha: 0.1), height: 1),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(width: 18, height: 18, color: AppColors.background),
                        const SizedBox(width: 8),
                        Container(width: 150, height: 16, color: AppColors.background),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Schedule slot list shimmer
  factory DgShimmer.scheduleSlotList({int count = 4}) {
    return DgShimmer(
      child: Column(
        children: List.generate(count, (index) => 
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(width: 120, height: 16, color: AppColors.background),
                      const SizedBox(height: 8),
                      Container(width: 80, height: 12, color: AppColors.background),
                    ],
                  ),
                ),
              ],
            ),
          )
        ),
      ),
    );
  }

  /// Payment screen shimmer
  factory DgShimmer.payment() {
    return DgShimmer(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Bill Card
            Container(
              width: double.infinity,
              height: 180,
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            const SizedBox(height: 16),
            // Instructions Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 150, height: 20, color: AppColors.surface),
                  const SizedBox(height: 24),
                  ...List.generate(5, (index) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Container(width: 24, height: 24, decoration: const BoxDecoration(color: AppColors.surface, shape: BoxShape.circle)),
                        const SizedBox(width: 12),
                        Expanded(child: Container(height: 14, color: AppColors.surface)),
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Cooking video card shimmer
  factory DgShimmer.cookingVideo({double width = 280}) {
    return DgShimmer(
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Container(
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 200, height: 16, color: AppColors.surface),
                  const SizedBox(height: 8),
                  Container(width: 100, height: 12, color: AppColors.surface),
                ],
              ),
            ),
          ],
        ),
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
              shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: isCircle
                  ? null
                  : BorderRadius.circular(borderRadius ?? AppSpacing.radiusSm),
            ),
          ),
    );
  }
}
