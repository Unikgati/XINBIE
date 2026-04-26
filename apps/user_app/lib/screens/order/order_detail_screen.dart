import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import '../../providers/order_provider.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;

  Future<void> _launchWhatsApp(String phone) async {
    final url = Uri.parse('https://wa.me/$phone');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _cancelOrder(BuildContext context, WidgetRef ref, String orderId) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Batalkan Pesanan?',
                style: AppTypography.h3.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pesanan yang dibatalkan tidak dapat dikembalikan. Apakah Anda yakin?',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Tidak', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text('Ya, Batalkan', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true && context.mounted) {
      showDialog(
        context: context, 
        barrierDismissible: false, 
        builder: (_) => const Center(child: CircularProgressIndicator())
      );
      
      try {
        await ref.read(orderRepositoryProvider).cancelOrder(orderId);
        if (context.mounted) {
          Navigator.pop(context); // close loading dialog
          ref.invalidate(orderDetailProvider(orderId));
          ref.invalidate(activeOrdersProvider);
          DgSnackbar.showSuccess(context, message: 'Pesanan berhasil dibatalkan');
        }
      } catch (e) {
        if (context.mounted) {
          Navigator.pop(context); // close loading dialog
          DgSnackbar.showError(context, message: 'Gagal membatalkan pesanan: $e');
        }
      }
    }
  }

  int _getStepIndex(OrderStatus status) {
    switch (status) {
      case OrderStatus.waitingPayment: return 0;
      case OrderStatus.received: return 1;
      case OrderStatus.processing: return 2;
      case OrderStatus.waitingDriver:
      case OrderStatus.inDelivery: return 3;
      case OrderStatus.delivered:
      case OrderStatus.completed: return 4;
      default: return 0;
    }
  }

  IconData _getStatusIcon(OrderStatus status) {
    if (status == OrderStatus.cancelled) return Icons.cancel_outlined;
    if (status == OrderStatus.problem) return Icons.warning_amber_outlined;
    
    const icons = [
      Icons.receipt_long_outlined,
      Icons.account_balance_wallet_outlined,
      Icons.inventory_2_outlined,
      Icons.local_shipping_outlined,
      Icons.where_to_vote_outlined,
    ];
    return icons[_getStepIndex(status)];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Detail Pesanan',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
      ),
      bottomNavigationBar: orderAsync.whenOrNull(
        data: (order) {
          if (order.orderStatus == OrderStatus.waitingPayment) {
            return Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: () => _cancelOrder(context, ref, orderId),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: const Text('Batalkan', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: DgButton(
                        label: 'Lanjutkan Pembayaran',
                        onPressed: () => context.push('/payment/${order.id}'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
          return null;
        },
      ),
      body: orderAsync.when(
        loading: () => DgShimmer.orderDetail(),
        error: (e, st) => const Center(child: Text('Gagal memuat detail pesanan')),
        data: (order) {
          final address = order.addressSnapshot;
          final step = _getStepIndex(order.orderStatus);
          final statusIcon = _getStatusIcon(order.orderStatus);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // High-level progress bar & Current Status
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(statusIcon, color: AppColors.primaryDark, size: 22),
                          const SizedBox(width: 8),
                          Text(
                            order.orderStatus.label,
                            style: AppTypography.h4.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      if (order.orderStatus != OrderStatus.cancelled && order.orderStatus != OrderStatus.problem) ...[
                        const SizedBox(height: 24),
                        _HorizontalProgress(currentStep: step),
                      ],

                      if (order.orderStatus != OrderStatus.cancelled) ...[
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _launchWhatsApp('6281234567890'), // Admin WhatsApp
                                icon: const Icon(Icons.help_outline, size: 18),
                                label: const Text('Bantuan'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryAction,
                                  foregroundColor: AppColors.textOnPrimary,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  minimumSize: const Size(0, 44),
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  elevation: 0,
                                ),
                              ),
                            ),
                            if (order.driverId != null) ...[
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    // couriers whatsapp usually in driver.phone
                                    // using a dummy one since driver object may not have phone deeply populated here
                                    _launchWhatsApp('6280987654321');
                                  },
                                  icon: const Icon(Icons.chat_outlined, size: 18),
                                  label: const Text('Kurir'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.primaryDark,
                                    side: const BorderSide(color: AppColors.border),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    minimumSize: const Size(0, 44),
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                      // Removed Batalkan Pesanan from here
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Address
                if (address != null)
                  _Section(
                    title: 'ALAMAT PENGIRIMAN',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(address['recipientName'] ?? '-', style: AppTypography.labelLarge),
                        const SizedBox(height: 4),
                        Text(address['fullAddress'] ?? '-', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                        if (address['notes'] != null && address['notes'].toString().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('Catatan: ${address['notes']}', style: AppTypography.caption.copyWith(color: AppColors.primaryDark)),
                          ),
                      ],
                    ),
                  ),
                if (address != null) const SizedBox(height: 16),

                // Order info
                _Section(
                  title: 'INFORMASI PESANAN',
                  child: Column(
                    children: [
                      _InfoRow('Kode Pesanan', order.code, isCopyable: true),
                      _InfoRow('Tanggal', DateFormatter.date(order.createdAt)),
                      _InfoRow('Pembayaran', '${order.paymentMethod.name.toUpperCase()} • ${order.paymentStatus.name}'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Items
                _Section(
                  title: 'DAFTAR BELANJA',
                  child: Column(
                    children: [
                      ...order.items!.map((item) => _ItemRow(
                            item.productSnapshot?['name'] ?? 'Item',
                            '${item.qty}x',
                            CurrencyFormatter.format(item.totalPrice),
                          )),
                      const Divider(height: 16),
                      _ItemRow('Subtotal', '', CurrencyFormatter.format(order.subtotal)),
                      _ItemRow('Ongkir', '', CurrencyFormatter.format(order.deliveryFee)),
                      if (order.discountAmount > 0)
                        _ItemRow('Diskon', '', '-${CurrencyFormatter.format(order.discountAmount)}'),
                      const Divider(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Grand Total', style: AppTypography.h4),
                            Text(CurrencyFormatter.format(order.grandTotal), style: AppTypography.h4.copyWith(color: AppColors.priceActive)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 80),
              ],
            ),
          );
        },
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

class _ItemRow extends StatelessWidget {
  const _ItemRow(this.name, this.qty, this.price);
  final String name, qty, price;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (qty.isNotEmpty) ...[
            Text('${qty}x', style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
            const SizedBox(width: 8),
          ],
          Expanded(child: Text(name, style: AppTypography.bodyMedium)),
          const SizedBox(width: 12),
          Text(price, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600)),
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
            // Line
            final stepIndex = index ~/ 2;
            final isCompleted = stepIndex < currentStep;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? AppColors.primaryAction : AppColors.divider,
              ),
            );
          } else {
            // Icon
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
