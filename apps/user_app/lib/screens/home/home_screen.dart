import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Header + Search
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Halo! 👋', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                              const SizedBox(height: 2),
                              Text('Mau masak apa hari ini?', style: AppTypography.h3),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/notifications'),
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
                            ),
                            child: const Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const DgSearchBar(readOnly: true, hintText: 'Cari sayur, buah, bumbu...'),
                  ],
                ),
              ),
            ),

            // Hero Banner
            SliverToBoxAdapter(
              child: Container(
                height: 160,
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Stack(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Gratis Ongkir',
                            style: AppTypography.h3.copyWith(color: AppColors.textOnPrimary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Min. belanja Rp 150.000',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textOnPrimary.withValues(alpha: 0.9),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Belanja Sekarang',
                              style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      right: 16,
                      bottom: 16,
                      child: Icon(Icons.local_offer, size: 80, color: AppColors.textOnPrimary.withValues(alpha: 0.2)),
                    ),
                  ],
                ),
              ),
            ),

            // Categories
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Kategori', style: AppTypography.h4),
                    Text('Lihat Semua', style: AppTypography.bodySmall.copyWith(color: AppColors.primary)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 100,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _CategoryItem(icon: Icons.grass, label: 'Sayuran', color: const Color(0xFF4CAF50), onTap: () {}),
                    _CategoryItem(icon: Icons.apple, label: 'Buah', color: const Color(0xFFFF9800), onTap: () {}),
                    _CategoryItem(icon: Icons.whatshot, label: 'Bumbu', color: const Color(0xFFF44336), onTap: () {}),
                    _CategoryItem(icon: Icons.egg, label: 'Protein', color: const Color(0xFF795548), onTap: () {}),
                    _CategoryItem(icon: Icons.rice_bowl, label: 'Pokok', color: const Color(0xFF9C27B0), onTap: () {}),
                    _CategoryItem(icon: Icons.local_drink, label: 'Minuman', color: const Color(0xFF2196F3), onTap: () {}),
                    _CategoryItem(icon: Icons.cookie, label: 'Snack', color: const Color(0xFFFF5722), onTap: () {}),
                    _CategoryItem(icon: Icons.ac_unit, label: 'Frozen', color: const Color(0xFF00BCD4), onTap: () {}),
                  ],
                ),
              ),
            ),

            // Featured Products
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Produk Pilihan 🔥', style: AppTypography.h4),
                    Text('Semua', style: AppTypography.bodySmall.copyWith(color: AppColors.primary)),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.62,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final products = _mockProducts;
                    if (index >= products.length) return null;
                    final p = products[index];
                    return DgProductCard(
                      name: p['name'] as String,
                      price: p['price'] as int,
                      unit: p['unit'] as String,
                      discountPrice: p['discountPrice'] as int?,
                      discountPercent: p['discountPercent'] as int?,
                      onTap: () => context.push('/product/mock-$index'),
                      onAddToCart: () {},
                    );
                  },
                  childCount: _mockProducts.length,
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}

class _CategoryItem extends StatelessWidget {
  const _CategoryItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 6),
            Text(label, style: AppTypography.caption.copyWith(fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

final _mockProducts = [
  {'name': 'Brokoli Segar', 'price': 15000, 'unit': 'ikat', 'discountPrice': null, 'discountPercent': null},
  {'name': 'Apel Fuji', 'price': 35000, 'unit': 'kg', 'discountPrice': 29000, 'discountPercent': 17},
  {'name': 'Dada Ayam Fillet', 'price': 45000, 'unit': 'pack', 'discountPrice': 39000, 'discountPercent': 13},
  {'name': 'Alpukat Mentega', 'price': 30000, 'unit': 'kg', 'discountPrice': null, 'discountPercent': null},
  {'name': 'Beras Organik 5kg', 'price': 85000, 'unit': 'karung', 'discountPrice': null, 'discountPercent': null},
  {'name': 'Jus Cold Pressed', 'price': 25000, 'unit': 'botol', 'discountPrice': null, 'discountPercent': null},
];
