import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class PaymentBottomSheet extends StatefulWidget {
  final String? selectedMethod;
  const PaymentBottomSheet({super.key, required this.selectedMethod});

  @override
  State<PaymentBottomSheet> createState() => _PaymentBottomSheetState();
}

class _PaymentBottomSheetState extends State<PaymentBottomSheet> {
  String? _expandedGroup;

  final List<Map<String, dynamic>> _paymentGroups = [
    { 'title': 'E-Wallet', 'methods': ['GOPAY', 'SHOPEEPAY', 'QRIS'] },
    { 'title': 'Transfer Bank (Virtual Account)', 'methods': ['VA_BCA', 'VA_MANDIRI', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'VA_CIMB'] },
    { 'title': 'Gerai Ritel', 'methods': ['ALFAMART', 'INDOMARET'] },
  ];

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

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Pilih Metode Pembayaran', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              child: Column(
                children: [
                  ..._paymentGroups.map((group) => _buildGroup(group['title'], group['methods'])),
                  _buildMethodItem('COD'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroup(String title, List<String> methods) {
    final isExpanded = _expandedGroup == title;
    return Column(
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(title, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold)),
          subtitle: Text(
            methods.map((m) => _getPaymentMethodName(m)).join(', '),
            style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
          onTap: () => setState(() => _expandedGroup = isExpanded ? null : title),
        ),
        if (isExpanded)
          Column(
            children: methods.map((m) => _buildMethodItem(m)).toList(),
          ),
        const Divider(height: 1),
      ],
    );
  }

  Widget _buildMethodItem(String method) {
    final isSelected = widget.selectedMethod == method;
    return InkWell(
      onTap: () => Navigator.pop(context, method),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        margin: const EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.05) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 32,
              height: 24,
              child: _getPaymentMethodImageUrl(method) != null
                  ? Image.asset(_getPaymentMethodImageUrl(method)!, fit: BoxFit.contain)
                  : Icon(_getPaymentMethodIcon(method), color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _getPaymentMethodName(method),
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary, size: 20)
            else
              const Icon(Icons.circle_outlined, color: AppColors.border, size: 20),
          ],
        ),
      ),
    );
  }
}
