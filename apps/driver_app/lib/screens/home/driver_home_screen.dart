import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/theme/app_colors.dart';
import 'package:ui_kit/theme/app_typography.dart';
import 'package:ui_kit/widgets/dg_badge.dart';
import 'package:ui_kit/widgets/dg_button.dart';
import 'package:ui_kit/widgets/dg_snackbar.dart';
import 'package:driver_app/screens/home/incoming_order_overlay.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key});
  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen> {
  bool _togglingOnline = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final socket = ref.read(socketServiceProvider);
      await socket.connect();
      print('🟢 Socket connected, attaching order:new listener');
      socket.onOrderNew((data) {
        print('📦 order:new received: $data');
        _handleIncomingOrder(data);
      });
      ref.read(onlineStatusProvider.notifier).sync();
    });
  }

  Future<void> _handleIncomingOrder(Map<String, dynamic> data) async {
    if (!mounted) return;
    
    final accepted = await IncomingOrderOverlay.show(context, data);
    if (accepted == true) {
      final orderId = data['orderId'] as String?;
      if (orderId != null) {
        try {
          // Tampilkan loading sebentar
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => const Center(child: CircularProgressIndicator()),
          );
          
          await ref.read(driverRepositoryProvider).acceptOrder(orderId);
          if (mounted) context.pop(); // tutup loading
          ref.invalidate(driverActiveOrdersProvider);
          if (mounted) DgSnackbar.showSuccess(context, message: 'Berhasil menerima orderan!');
        } catch (e) {
          if (mounted) context.pop(); // tutup loading
          if (mounted) DgSnackbar.showError(context, message: 'Gagal menerima orderan', error: e);
        }
      }
    }
  }

  @override
  void dispose() {
    ref.read(socketServiceProvider).offOrderNew();
    super.dispose();
  }

  Future<void> _toggleOnline() async {
    setState(() => _togglingOnline = true);
    try {
      await ref.read(onlineStatusProvider.notifier).toggle();
      final isOnline = ref.read(onlineStatusProvider);
      final locationService = ref.read(driverLocationServiceProvider);

      if (isOnline) {
        // Start GPS tracking + refresh orders
        await locationService.start(mode: 'idle');
        ref.invalidate(driverActiveOrdersProvider);
      } else {
        // Stop GPS
        locationService.stop();
      }
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal ubah status', error: e);
    } finally {
      if (mounted) setState(() => _togglingOnline = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(driverAuthNotifierProvider);
    final isOnline = ref.watch(onlineStatusProvider);
    final asyncOrders = ref.watch(driverActiveOrdersProvider);

    final userName = authState.maybeWhen(
      authenticated: (user) => user.name,
      orElse: () => 'Driver',
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(driverActiveOrdersProvider);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Header ──
            // ── Header & Toggle ──
            SliverToBoxAdapter(
              child: Stack(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: double.infinity,
                        height: 220,
                        decoration: const BoxDecoration(
                          gradient: AppColors.heroGradient,
                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
                        ),
                      ),
                      Positioned(
                        right: 10,
                        bottom: 0, // Nempel dengan bawah gradient
                        child: Image.asset(
                          'assets/images/mascot_driver.png',
                          height: 180,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ],
                  ),
                  SafeArea(
                    bottom: false,
                    child: Column(
                      children: [
                        // Avatar and name
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.white,
                                child: Text(
                                  userName.isNotEmpty ? userName[0].toUpperCase() : 'D',
                                  style: AppTypography.h3.copyWith(color: AppColors.primary),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      userName.isNotEmpty ? userName : 'Driver',
                                      style: AppTypography.h4.copyWith(color: Colors.white),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Driver',
                                      style: AppTypography.bodyMedium.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                                    ),
                                  ],
                                ),
                              ),
                              GestureDetector(
                                onTap: () {},
                                child: Container(
                                  width: 44,
                                  height: 44,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.notifications_none, color: AppColors.primaryDark),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Toggle and Stats placed naturally here, overlapping the gradient
                        const SizedBox(height: 64),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            children: [
                              // Online toggle
                              ElevatedButton.icon(
                                onPressed: _togglingOnline ? null : _toggleOnline,
                                icon: _togglingOnline
                                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : const Icon(Icons.power_settings_new),
                                label: Text(isOnline ? 'Nonaktifkan' : 'Aktifkan'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isOnline ? AppColors.error : Colors.black,
                                  disabledBackgroundColor: isOnline ? AppColors.error : Colors.black,
                                  foregroundColor: Colors.white,
                                  disabledForegroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                  shape: const StadiumBorder(),
                                  textStyle: AppTypography.h4.copyWith(color: Colors.white),
                                  elevation: 4,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Active Orders List ──
            if (isOnline)
              asyncOrders.when(
                data: (orders) {
                  if (orders.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              child: const Icon(Icons.hourglass_empty, size: 80, color: AppColors.border),
                            ),
                            Text('Belum ada order aktif', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
                            const SizedBox(height: 8),
                            Text(
                              'Kamu sudah online. Sistem sedang\nmencarikan order untukmu.',
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 200), // Push the empty state up to align center visually
                          ],
                        ),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.only(left: 16, right: 16, bottom: 120),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) {
                          final o = orders[i];
                          final code = o['code'] as String? ?? '';
                          final status = _parseStatus(o['orderStatus'] as String? ?? '');
                          final addr = o['addressSnapshot'] as Map<String, dynamic>? ?? {};
                          final customer = addr['recipientName'] as String? ?? 'Pelanggan';
                          final address = addr['fullAddress'] as String? ?? '-';
                          final items = o['items'] as List? ?? [];
                          final grandTotal = o['grandTotal'] as int? ?? 0;
                          final isNew = status == OrderStatus.waitingDriver;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _OrderCard(
                              code: code,
                              customer: customer,
                              address: address,
                              items: '${items.length} item • Rp ${_formatK(grandTotal)}',
                              status: status,
                              isNew: isNew,
                              onTap: () => context.push('/order/${o['id']}'),
                            ),
                          );
                        },
                        childCount: orders.length,
                      ),
                    ),
                  );
                },
                loading: () => SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, __) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _ShimmerOrderCard(),
                      ),
                      childCount: 3,
                    ),
                  ),
                ),
                error: (e, _) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                        const SizedBox(height: 8),
                        Text('Gagal memuat: $e', style: AppTypography.bodySmall),
                        const SizedBox(height: 8),
                        DgButton(
                          label: 'Coba Lagi',
                          isOutlined: true,
                          onPressed: () => ref.invalidate(driverActiveOrdersProvider),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.cloud_off, size: 64, color: AppColors.border),
                      const SizedBox(height: 12),
                      Text('Kamu sedang offline', style: AppTypography.h4.copyWith(color: AppColors.textSecondary)),
                      Text('Nyalakan toggle untuk menerima pesanan', style: AppTypography.bodySmall.copyWith(color: AppColors.textHint)),
                      const SizedBox(height: 200), // Push the empty state up to align center visually
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  OrderStatus _parseStatus(String s) {
    switch (s) {
      case 'WAITING_DRIVER': return OrderStatus.waitingDriver;
      case 'IN_DELIVERY': return OrderStatus.inDelivery;
      default: return OrderStatus.waitingDriver;
    }
  }

  String _formatK(int amount) {
    if (amount >= 1000000) return '${(amount / 1000000).toStringAsFixed(1)}jt';
    if (amount >= 1000) return '${(amount / 1000).toStringAsFixed(0)}K';
    return amount.toString();
  }
}

// ── Order Card ──
class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.code, required this.customer, required this.address, required this.items, required this.status, this.isNew = false, required this.onTap});
  final String code, customer, address, items;
  final OrderStatus status;
  final bool isNew;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: isNew ? Border.all(color: AppColors.primary, width: 1.5) : null,
          boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(code, style: AppTypography.labelLarge),
              DgStatusBadge(status: status),
            ]),
            if (isNew) ...[
              const SizedBox(height: 4),
              DgBadge(label: '🔔 Pesanan Baru!', color: AppColors.warning),
            ],
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.person_outlined, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(customer, style: AppTypography.bodyMedium),
            ]),
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Expanded(child: Text(address, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ]),
            const SizedBox(height: 4),
            Text(items, style: AppTypography.bodySmall.copyWith(color: AppColors.textHint)),
          ],
        ),
      ),
    );
  }
}

// ── Shimmer Widgets ──

class _ShimmerOrderCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            DgShimmer(width: 120, height: 14, borderRadius: 6),
            DgShimmer(width: 80, height: 22, borderRadius: 12),
          ]),
          const SizedBox(height: 12),
          DgShimmer(width: 160, height: 12, borderRadius: 6),
          const SizedBox(height: 8),
          DgShimmer(width: double.infinity, height: 12, borderRadius: 6),
          const SizedBox(height: 8),
          DgShimmer(width: 100, height: 12, borderRadius: 6),
        ],
      ),
    );
  }
}
