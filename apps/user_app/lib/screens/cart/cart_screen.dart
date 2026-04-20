import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _items = [
    _CartItemData('Brokoli Segar', 15000, 'ikat', 2),
    _CartItemData('Apel Fuji', 29000, 'kg', 1),
    _CartItemData('Dada Ayam Fillet', 39000, 'pack', 1),
  ];

  int get _subtotal => _items.fold(0, (s, i) => s + i.price * i.qty);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Keranjang (${_items.length})'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
      ),
      body: _items.isEmpty
          ? const DgEmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Keranjang Kosong',
              subtitle: 'Yuk mulai belanja bahan dapur sehat!',
              actionLabel: 'Belanja Sekarang',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final item = _items[i];
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                    boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
                  ),
                  child: Row(
                    children: [
                      // Image placeholder
                      Container(
                        width: 72, height: 72,
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.image, color: AppColors.textHint),
                      ),
                      const SizedBox(width: 12),

                      // Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.name, style: AppTypography.labelLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text(
                              'Rp ${_fmt(item.price)}/${item.unit}',
                              style: AppTypography.priceActive.copyWith(color: AppColors.priceActive, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                DgQuantitySelector(
                                  quantity: item.qty,
                                  compact: true,
                                  onChanged: (v) => setState(() {
                                    if (v <= 0) { _items.removeAt(i); } else { item.qty = v; }
                                  }),
                                ),
                                const Spacer(),
                                Text(
                                  'Rp ${_fmt(item.price * item.qty)}',
                                  style: AppTypography.labelLarge.copyWith(color: AppColors.textPrimary),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

      // Bottom checkout bar
      bottomNavigationBar: _items.isEmpty ? null : Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 8, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                  Text('Rp ${_fmt(_subtotal)}', style: AppTypography.h3.copyWith(color: AppColors.priceActive)),
                ],
              ),
              const SizedBox(width: 20),
              Expanded(
                child: DgButton(
                  label: 'Checkout',
                  icon: Icons.arrow_forward,
                  onPressed: () => context.push('/checkout'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _fmt(int n) => n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
}

class _CartItemData {
  final String name;
  final int price;
  final String unit;
  int qty;
  _CartItemData(this.name, this.price, this.unit, this.qty);
}
