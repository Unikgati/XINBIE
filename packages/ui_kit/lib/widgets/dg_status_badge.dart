import 'package:flutter/material.dart';
import 'package:core/constants/enums.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Color-coded status badge for orders.
class DgStatusBadge extends StatelessWidget {
  const DgStatusBadge({super.key, required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, color: _textColor, size: 14),
          const SizedBox(width: 4),
          Text(
            status.label,
            style: AppTypography.labelSmall.copyWith(
              color: _textColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  IconData get _icon {
    switch (status) {
      case OrderStatus.waitingPayment:
        return Icons.account_balance_wallet_outlined;
      case OrderStatus.received:
        return Icons.receipt_long_outlined;
      case OrderStatus.processing:
        return Icons.inventory_2_outlined;
      case OrderStatus.waitingDriver:
        return Icons.two_wheeler_outlined;
      case OrderStatus.inDelivery:
        return Icons.local_shipping_outlined;
      case OrderStatus.delivered:
        return Icons.where_to_vote_outlined;
      case OrderStatus.completed:
        return Icons.check_circle_outline;
      case OrderStatus.cancelled:
        return Icons.cancel_outlined;
      case OrderStatus.problem:
        return Icons.error_outline;
    }
  }

  Color get _bgColor {
    switch (status) {
      case OrderStatus.waitingPayment:
        return const Color(0xFFFFF3E0);
      case OrderStatus.received:
        return const Color(0xFFE3F2FD);
      case OrderStatus.processing:
        return const Color(0xFFF3E5F5);
      case OrderStatus.waitingDriver:
        return const Color(0xFFFFF3E0);
      case OrderStatus.inDelivery:
        return const Color(0xFFE8F5E9);
      case OrderStatus.delivered:
        return const Color(0xFFE8F5E9);
      case OrderStatus.completed:
        return const Color(0xFFE8F5E9);
      case OrderStatus.cancelled:
        return const Color(0xFFFFEBEE);
      case OrderStatus.problem:
        return const Color(0xFFFFF3E0);
    }
  }

  Color get _textColor {
    switch (status) {
      case OrderStatus.waitingPayment:
        return const Color(0xFFE65100);
      case OrderStatus.received:
        return const Color(0xFF1565C0);
      case OrderStatus.processing:
        return const Color(0xFF7B1FA2);
      case OrderStatus.waitingDriver:
        return const Color(0xFFE65100);
      case OrderStatus.inDelivery:
        return AppColors.primaryDark;
      case OrderStatus.delivered:
        return AppColors.primaryDark;
      case OrderStatus.completed:
        return AppColors.primaryDark;
      case OrderStatus.cancelled:
        return AppColors.error;
      case OrderStatus.problem:
        return const Color(0xFFE65100);
    }
  }
}
