import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class OrderProgressCard extends StatelessWidget {
  final OrderStatus status;
  final int step;
  final IconData statusIcon;
  final VoidCallback onHelp;
  final VoidCallback? onChatCourier;

  const OrderProgressCard({
    super.key,
    required this.status,
    required this.step,
    required this.statusIcon,
    required this.onHelp,
    this.onChatCourier,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(statusIcon, color: AppColors.primaryDark, size: 22),
              const SizedBox(width: 8),
              Text(
                status.label,
                style: AppTypography.h4.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          if (status != OrderStatus.cancelled && status != OrderStatus.problem) ...[
            const SizedBox(height: 24),
            RepaintBoundary(child: _HorizontalProgress(currentStep: step)),
          ],
          if (status != OrderStatus.cancelled) ...[
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onHelp,
                    icon: const Icon(Icons.help_outline, size: 18),
                    label: const Text('Bantuan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryAction,
                      foregroundColor: AppColors.textOnPrimary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      minimumSize: const Size(0, 44),
                      elevation: 0,
                    ),
                  ),
                ),
                if (onChatCourier != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onChatCourier,
                      icon: const Icon(Icons.chat_outlined, size: 18),
                      label: const Text('Kurir'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryDark,
                        side: const BorderSide(color: AppColors.border),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        minimumSize: const Size(0, 44),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _HorizontalProgress extends StatelessWidget {
  const _HorizontalProgress({required this.currentStep});
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    const icons = [
      Icons.receipt_long_outlined,
      Icons.account_balance_wallet_outlined,
      Icons.inventory_2_outlined,
      Icons.local_shipping_outlined,
      Icons.where_to_vote_outlined,
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(icons.length * 2 - 1, (index) {
          if (index.isOdd) {
            final stepIndex = index ~/ 2;
            final isCompleted = stepIndex < currentStep;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? AppColors.primaryAction : AppColors.divider,
              ),
            );
          } else {
            final stepIndex = index ~/ 2;
            final isActive = stepIndex <= currentStep;
            return Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isActive ? AppColors.primarySurface : AppColors.background,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isActive ? AppColors.primaryAction : AppColors.border,
                  width: isActive ? 1.5 : 1,
                ),
              ),
              child: Icon(
                icons[stepIndex],
                size: 18,
                color: isActive ? AppColors.primaryAction : AppColors.textHint,
              ),
            );
          }
        }),
      ),
    );
  }
}
