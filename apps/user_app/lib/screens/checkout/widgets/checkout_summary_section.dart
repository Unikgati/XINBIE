import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class CheckoutSummarySection extends StatelessWidget {
  final double subtotal;
  final double deliveryFee;
  final int promoDiscount;
  final int totalItems;

  const CheckoutSummarySection({
    super.key,
    required this.subtotal,
    required this.deliveryFee,
    required this.promoDiscount,
    required this.totalItems,
  });

  String _formatNumber(num n) {
    return n.toInt().toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
  }

  @override
  Widget build(BuildContext context) {
    final grandTotal = subtotal + deliveryFee - promoDiscount;

    return _Section(
      title: 'RINGKASAN PEMBAYARAN',
      child: Column(
        children: [
          _SummaryRow('Subtotal ($totalItems item)', 'Rp ${_formatNumber(subtotal)}'),
          _SummaryRow('Ongkos Kirim', 'Rp ${_formatNumber(deliveryFee)}'),
          if (promoDiscount > 0)
            _SummaryRow(
              'Diskon Promo',
              '-Rp ${_formatNumber(promoDiscount)}',
              valueColor: AppColors.success,
            ),
          const Divider(height: 24),
          _SummaryRow(
            'Grand Total',
            'Rp ${_formatNumber(grandTotal)}',
            isBold: true,
            fontSize: 18,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow(
    this.label,
    this.value, {
    this.isBold = false,
    this.valueColor,
    this.fontSize,
  });

  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;
  final double? fontSize;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTypography.bodyMedium.copyWith(
              color: isBold ? AppColors.primaryDark : AppColors.textSecondary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: AppTypography.labelLarge.copyWith(
              color: valueColor ?? AppColors.primaryDark,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              fontSize: fontSize,
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
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
