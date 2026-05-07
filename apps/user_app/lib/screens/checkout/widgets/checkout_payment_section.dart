import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class CheckoutPaymentSection extends StatefulWidget {
  final String? selectedMethod;
  final ValueChanged<String> onSelected;

  const CheckoutPaymentSection({
    super.key,
    required this.selectedMethod,
    required this.onSelected,
  });

  @override
  State<CheckoutPaymentSection> createState() => _CheckoutPaymentSectionState();
}

class _CheckoutPaymentSectionState extends State<CheckoutPaymentSection> {
  String? _expandedGroup;

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

  IconData _getPaymentMethodIcon(String code) {
    if (code.startsWith('VA_')) return Icons.account_balance;
    if (code == 'COD') return Icons.inventory_2_outlined;
    if (code == 'QRIS') return Icons.qr_code_2;
    if (code == 'ALFAMART' || code == 'INDOMARET') return Icons.storefront;
    return Icons.account_balance_wallet;
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

  Widget _buildAccordionGroup(String title, List<String> methods) {
    final isExpanded = _expandedGroup == title;
    final methodNames = methods.map((m) => _getPaymentMethodName(m)).toList();
    String subtitle = methodNames.length <= 3 
        ? methodNames.join(', ') 
        : '${methodNames.take(3).join(', ')} +${methodNames.length - 3} lainnya';

    return Column(
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _expandedGroup = isExpanded ? null : title;
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Icon(
                  isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
        ),
        if (isExpanded)
          Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Column(
              children: methods.map((method) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _SelectableCard(
                  title: _getPaymentMethodName(method),
                  iconData: _getPaymentMethodIcon(method),
                  imageUrl: _getPaymentMethodImageUrl(method),
                  isSelected: widget.selectedMethod == method,
                  onTap: () => widget.onSelected(method),
                ),
              )).toList(),
            ),
          ),
        const Divider(height: 1),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return _Section(
      title: 'METODE PEMBAYARAN',
      child: Column(
        children: [
          _buildAccordionGroup('E-Wallet', ['GOPAY', 'SHOPEEPAY', 'QRIS']),
          _buildAccordionGroup('Transfer Bank (Virtual Account)', ['VA_BCA', 'VA_MANDIRI', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'VA_CIMB']),
          _buildAccordionGroup('Gerai Ritel', ['ALFAMART', 'INDOMARET']),
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 8),
            child: _SelectableCard(
              title: _getPaymentMethodName('COD'),
              iconData: _getPaymentMethodIcon('COD'),
              imageUrl: _getPaymentMethodImageUrl('COD'),
              isSelected: widget.selectedMethod == 'COD',
              onTap: () => widget.onSelected('COD'),
            ),
          ),
          const Divider(height: 1),
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
