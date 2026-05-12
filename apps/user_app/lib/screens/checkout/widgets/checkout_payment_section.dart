import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'payment_bottom_sheet.dart';

class CheckoutPaymentSection extends StatelessWidget {
  final String? selectedMethod;
  final ValueChanged<String> onSelected;

  const CheckoutPaymentSection({
    super.key,
    required this.selectedMethod,
    required this.onSelected,
  });

  String _getPaymentMethodName(String code) {
    switch (code) {
      case 'GOPAY': return 'GoPay';
      case 'SHOPEEPAY': return 'ShopeePay';
      case 'QRIS': return 'QRIS';
      case 'VA_BCA': return 'BCA (VA)';
      case 'VA_MANDIRI': return 'Mandiri (VA)';
      case 'VA_BNI': return 'BNI (VA)';
      case 'VA_BRI': return 'BRI (VA)';
      case 'VA_PERMATA': return 'Permata (VA)';
      case 'VA_CIMB': return 'CIMB (VA)';
      case 'ALFAMART': return 'Alfamart';
      case 'INDOMARET': return 'Indomaret';
      case 'COD': return 'Bayar di Tempat (COD)';
      default: return code;
    }
  }

  String? _getPaymentMethodImageUrl(String code) {
    switch (code) {
      case 'GOPAY': return 'assets/images/payments/gopay.png';
      case 'SHOPEEPAY': return 'assets/images/payments/shopeepay.png';
      case 'QRIS': return 'assets/images/payments/qris.png';
      case 'VA_BCA': return 'assets/images/payments/bca.png';
      case 'VA_MANDIRI': return 'assets/images/payments/mandiri.png';
      case 'VA_BNI': return 'assets/images/payments/bni.png';
      case 'VA_BRI': return 'assets/images/payments/bri.png';
      case 'VA_PERMATA': return 'assets/images/payments/permata.png';
      case 'VA_CIMB': return 'assets/images/payments/cimb.png';
      case 'ALFAMART': return 'assets/images/payments/alfamart.png';
      case 'INDOMARET': return 'assets/images/payments/indomaret.png';
      case 'COD': return 'assets/images/payments/cod.png';
      default: return null;
    }
  }

  Future<void> _showPicker(BuildContext context) async {
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PaymentBottomSheet(selectedMethod: selectedMethod),
    );

    if (result != null) {
      onSelected(result);
    }
  }

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'METODE PEMBAYARAN',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              TextButton(
                onPressed: () => _showPicker(context),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  selectedMethod == null ? 'Pilih' : 'Ganti',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: () => _showPicker(context),
            child: selectedMethod == null
                ? Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          'Mohon pilih metode pembayaran',
                          style: AppTypography.bodySmall.copyWith(color: Colors.red[800], fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  )
                : Row(
                    children: [
                      Container(
                        width: 40,
                        height: 32,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border.withOpacity(0.5)),
                        ),
                        child: _getPaymentMethodImageUrl(selectedMethod!) != null
                            ? Image.asset(_getPaymentMethodImageUrl(selectedMethod!)!, fit: BoxFit.contain)
                            : const Icon(Icons.payments, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getPaymentMethodName(selectedMethod!),
                              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Metode terpilih',
                              style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.textSecondary),
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

class _SelectableCard extends StatelessWidget {
  const _SelectableCard({
    required this.title,
    required this.iconData,
    this.imageUrl,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final IconData iconData;
  final String? imageUrl;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
          color: isSelected ? AppColors.primary.withOpacity(0.05) : Colors.transparent,
        ),
        child: Row(
          children: [
            if (imageUrl != null)
              Image.asset(
                imageUrl!,
                height: 18,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Icon(iconData, size: 20, color: AppColors.primary),
              )
            else
              Icon(iconData, size: 24, color: AppColors.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
          ],
        ),
      ),
    );
  }
}
