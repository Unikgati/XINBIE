import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class CheckoutSummarySection extends StatelessWidget {
  final double subtotal;
  final double deliveryFee;
  final int promoDiscount;
  final int totalItems;

  // Promo props
  final TextEditingController promoController;
  final String? appliedPromoCode;
  final bool isValidatingPromo;
  final VoidCallback onApplyPromo;
  final VoidCallback onRemovePromo;
  final VoidCallback onBrowseVouchers;

  const CheckoutSummarySection({
    super.key,
    required this.subtotal,
    required this.deliveryFee,
    required this.promoDiscount,
    required this.totalItems,
    required this.promoController,
    required this.appliedPromoCode,
    required this.isValidatingPromo,
    required this.onApplyPromo,
    required this.onRemovePromo,
    required this.onBrowseVouchers,
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
          // Promo Section (Web-like integrated)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Makin Hemat Pakai Promo',
                      style: AppTypography.labelLarge.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryDark,
                      ),
                    ),
                    TextButton(
                      onPressed: onBrowseVouchers,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: AppColors.primary,
                      ),
                      child: const Text('Pilih Voucher', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (appliedPromoCode != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.success.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Promo $appliedPromoCode berhasil',
                            style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                        GestureDetector(
                          onTap: onRemovePromo,
                          child: const Text(
                            'Hapus',
                            style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.divider),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: promoController,
                            style: const TextStyle(fontSize: 13),
                            decoration: const InputDecoration(
                              hintText: 'Masukkan kode promo...',
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.only(left: 12),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(4.0),
                          child: SizedBox(
                            height: double.infinity,
                            child: ElevatedButton(
                              onPressed: isValidatingPromo ? null : onApplyPromo,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryDark,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                              ),
                              child: isValidatingPromo
                                  ? const SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Pakai', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1),
          ),

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
            'Total Belanja',
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
