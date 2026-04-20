import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});
  final String productId;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _qty = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // Image header
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: AppColors.background,
                child: const Center(
                  child: Icon(Icons.shopping_basket_outlined, size: 100, color: AppColors.textHint),
                ),
              ),
            ),
            leading: _CircleBack(onTap: () => context.pop()),
          ),

          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              transform: Matrix4.translationValues(0, -24, 0),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category badge
                    DgBadge(label: 'Sayuran', color: AppColors.primarySurface, textColor: AppColors.primaryDark),
                    const SizedBox(height: 12),

                    // Name
                    Text('Brokoli Segar', style: AppTypography.h2),
                    const SizedBox(height: 8),

                    // Price
                    Row(
                      children: [
                        Text('Rp 15.000', style: AppTypography.priceActive.copyWith(color: AppColors.priceActive, fontSize: 22)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.border),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text('/ikat', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Description
                    Text('Deskripsi', style: AppTypography.h4),
                    const SizedBox(height: 8),
                    Text(
                      'Brokoli segar berkualitas tinggi, langsung dari petani pilihan. '
                      'Kaya akan vitamin C, K, dan serat. Cocok untuk tumis, sup, atau salad.',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.6),
                    ),
                    const SizedBox(height: 24),

                    // Nutrition info
                    Text('Info Nutrisi', style: AppTypography.h4),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _NutritionChip(label: 'Vitamin C', value: 'Tinggi', color: const Color(0xFFFF9800)),
                        const SizedBox(width: 8),
                        _NutritionChip(label: 'Serat', value: 'Tinggi', color: AppColors.primary),
                        const SizedBox(width: 8),
                        _NutritionChip(label: 'Kalori', value: 'Rendah', color: const Color(0xFF2196F3)),
                      ],
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),

      // Bottom bar
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 8, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Quantity
              DgQuantitySelector(
                quantity: _qty,
                min: 1,
                onChanged: (v) => setState(() => _qty = v),
              ),
              const SizedBox(width: 16),

              // Add to cart button
              Expanded(
                child: DgButton(
                  label: 'Tambah ke Keranjang',
                  icon: Icons.shopping_cart_outlined,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('$_qty item ditambahkan ke keranjang'),
                        backgroundColor: AppColors.primary,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CircleBack extends StatelessWidget {
  const _CircleBack({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
          ),
          child: const Icon(Icons.arrow_back, size: 20),
        ),
      ),
    );
  }
}

class _NutritionChip extends StatelessWidget {
  const _NutritionChip({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(value, style: AppTypography.labelSmall.copyWith(color: color, fontWeight: FontWeight.w700)),
          Text(label, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
