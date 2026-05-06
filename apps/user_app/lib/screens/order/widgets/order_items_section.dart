import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class OrderItemsSection extends StatelessWidget {
  final Order order;

  const OrderItemsSection({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return _Section(
      title: 'DAFTAR BELANJA',
      child: Column(
        children: [
          ...order.items!.map((item) => _ItemRow(
                item.productSnapshot?['name'] ?? 'Item',
                '${item.qty}x',
                CurrencyFormatter.format(item.totalPrice),
              )),
          const Divider(height: 16),
          _ItemRow('Subtotal', '', CurrencyFormatter.format(order.subtotal)),
          _ItemRow('Ongkir', '', CurrencyFormatter.format(order.deliveryFee)),
          if (order.discountAmount > 0)
            _ItemRow('Diskon', '', '-${CurrencyFormatter.format(order.discountAmount)}'),
          const Divider(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Grand Total', style: AppTypography.h4),
                Text(CurrencyFormatter.format(order.grandTotal), style: AppTypography.h4.copyWith(color: AppColors.priceActive)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 4)],
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow(this.name, this.qty, this.price);
  final String name, qty, price;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (qty.isNotEmpty) ...[
            Text('${qty}x', style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
            const SizedBox(width: 8),
          ],
          Expanded(child: Text(name, style: AppTypography.bodyMedium)),
          const SizedBox(width: 12),
          Text(price, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
