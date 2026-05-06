import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class OrderAddressSection extends StatelessWidget {
  final Map<String, dynamic>? address;

  const OrderAddressSection({super.key, this.address});

  @override
  Widget build(BuildContext context) {
    if (address == null) return const SizedBox.shrink();

    return _Section(
      title: 'ALAMAT PENGIRIMAN',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(address!['recipientName'] ?? '-', style: AppTypography.labelLarge),
          const SizedBox(height: 4),
          Text(address!['fullAddress'] ?? '-', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
          if (address!['notes'] != null && address!['notes'].toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Catatan: ${address!['notes']}', style: AppTypography.caption.copyWith(color: AppColors.primaryDark)),
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
