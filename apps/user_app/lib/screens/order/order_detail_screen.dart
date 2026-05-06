import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import '../../providers/order_provider.dart';
import 'widgets/order_progress_card.dart';
import 'widgets/order_address_section.dart';
import 'widgets/order_info_section.dart';
import 'widgets/order_items_section.dart';

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
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 48, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 24),
              const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Batalkan Pesanan?', style: AppTypography.h3.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Pesanan yang dibatalkan tidak dapat dikembalikan. Apakah Anda yakin?', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.textSecondary, side: const BorderSide(color: AppColors.border), padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                      child: const Text('Tidak', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
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
      showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
      try {
        await ref.read(orderRepositoryProvider).cancelOrder(orderId);
        if (context.mounted) {
          Navigator.pop(context);
          ref.invalidate(orderDetailProvider(orderId));
          ref.invalidate(activeOrdersProvider);
          DgSnackbar.showSuccess(context, message: 'Pesanan berhasil dibatalkan');
        }
      } catch (e) {
        if (context.mounted) {
          Navigator.pop(context);
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
    const icons = [Icons.receipt_long_outlined, Icons.account_balance_wallet_outlined, Icons.inventory_2_outlined, Icons.local_shipping_outlined, Icons.where_to_vote_outlined];
    return icons[_getStepIndex(status)];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text('Detail Pesanan', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
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
                        style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red), padding: const EdgeInsets.symmetric(vertical: 14)),
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
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                OrderProgressCard(
                  status: order.orderStatus,
                  step: _getStepIndex(order.orderStatus),
                  statusIcon: _getStatusIcon(order.orderStatus),
                  onHelp: () => _launchWhatsApp('6281234567890'),
                  onChatCourier: order.driverId != null ? () => _launchWhatsApp('6280987654321') : null,
                ),
                const SizedBox(height: 16),
                OrderAddressSection(address: order.addressSnapshot),
                const SizedBox(height: 16),
                OrderInfoSection(order: order),
                const SizedBox(height: 16),
                OrderItemsSection(order: order),
                const SizedBox(height: 80),
              ],
            ),
          );
        },
      ),
    );
  }
}
