import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';

class OrderInfoSection extends StatelessWidget {
  final Order order;

  const OrderInfoSection({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return _Section(
      title: 'INFORMASI PESANAN',
      child: Column(
        children: [
          _InfoRow('Kode Pesanan', order.code, isCopyable: true),
          _InfoRow('Tanggal', DateFormatter.date(order.createdAt)),
          _InfoRow('Pembayaran', '${order.paymentMethod.name.toUpperCase()} • ${order.paymentStatus.name}'),
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

class _InfoRow extends StatefulWidget {
  const _InfoRow(this.label, this.value, {this.isCopyable = false});
  final String label, value;
  final bool isCopyable;

  @override
  State<_InfoRow> createState() => _InfoRowState();
}

class _InfoRowState extends State<_InfoRow> {
  bool _copied = false;

  void _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.value));
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(widget.label, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
          Row(
            children: [
              Text(widget.value, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600)),
              if (widget.isCopyable) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _copy,
                  child: Icon(
                    _copied ? Icons.check : Icons.copy_rounded,
                    size: 16,
                    color: _copied ? AppColors.success : AppColors.primaryAction,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
