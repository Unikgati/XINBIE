import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key, required this.categoryId, required this.categoryName});
  final String categoryId;
  final String categoryName;

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  String _sort = 'newest';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(widget.categoryName)),
      body: Column(
        children: [
          // Filter chips
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                _FilterChip(label: 'Terbaru', isSelected: _sort == 'newest', onTap: () => setState(() => _sort = 'newest')),
                _FilterChip(label: 'Harga ↑', isSelected: _sort == 'price_asc', onTap: () => setState(() => _sort = 'price_asc')),
                _FilterChip(label: 'Harga ↓', isSelected: _sort == 'price_desc', onTap: () => setState(() => _sort = 'price_desc')),
                _FilterChip(label: 'Nama A-Z', isSelected: _sort == 'name', onTap: () => setState(() => _sort = 'name')),
              ],
            ),
          ),

          // Product grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.62,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
              itemCount: 6,
              itemBuilder: (context, index) {
                return DgProductCard(
                  name: 'Produk ${index + 1}',
                  price: 15000 + (index * 5000),
                  unit: 'pcs',
                  onTap: () => context.push('/product/cat-$index'),
                  onAddToCart: () {},
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.isSelected, required this.onTap});
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: DgCategoryChip(label: label, isSelected: isSelected, onTap: onTap),
    );
  }
}
