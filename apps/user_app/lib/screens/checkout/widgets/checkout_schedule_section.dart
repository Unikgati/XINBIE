import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:intl/intl.dart';
import 'package:core/core.dart';

class CheckoutScheduleSection extends StatelessWidget {
  final DateTime scheduledDate;
  final DeliverySlot? deliverySlot;
  final VoidCallback onTap;

  const CheckoutScheduleSection({
    super.key,
    required this.scheduledDate,
    required this.deliverySlot,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheduleDisplay = deliverySlot != null 
        ? '${DateFormat('dd MMM yyyy').format(scheduledDate)} • ${deliverySlot!.label}'
        : 'Belum diatur';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Section(
          title: 'JADWAL PENGIRIMAN',
          trailing: GestureDetector(
            onTap: onTap,
            child: Text(
              deliverySlot == null ? 'Atur' : 'Ganti',
              style: AppTypography.labelLarge.copyWith(color: AppColors.primary),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      scheduleDisplay, 
                      style: AppTypography.labelLarge.copyWith(
                        color: deliverySlot == null ? AppColors.primary : AppColors.primaryDark
                      )
                    ),
                    if (deliverySlot == null)
                      Text(
                        'Default H+2',
                        style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (deliverySlot == null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade600, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Mohon atur jadwal pengiriman sebelum melanjutkan pesanan.',
                      style: AppTypography.bodySmall.copyWith(color: Colors.red.shade700),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.trailing});
  final String title;
  final Widget child;
  final Widget? trailing;

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
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
