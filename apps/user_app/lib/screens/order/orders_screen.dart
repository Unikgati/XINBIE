import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import '../../providers/user_providers.dart';
import '../../providers/order_provider.dart';
import 'package:core/core.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});
  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Pesanan Saya',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
      ),
      body: authState.when(
        data: (isLoggedIn) {
          if (!isLoggedIn) {
            return Center(
              child: DgEmptyState(
                icon: Icons.lock_outline,
                title: 'Belum Masuk',
                subtitle: 'Yuk masuk atau daftar akun dulu biar bisa lihat riwayat pesanan kamu!',
                actionLabel: 'Masuk Sekarang',
                onAction: () => context.push('/login'),
              ),
            );
          }

          return Column(
            children: [
              RepaintBoundary(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFEFEF),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TabBar(
                    controller: _tabCtrl,
                    indicator: BoxDecoration(
                      color: AppColors.primaryAction,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    labelColor: Colors.white,
                    unselectedLabelColor: AppColors.textSecondary,
                    dividerColor: Colors.transparent,
                    indicatorSize: TabBarIndicatorSize.tab,
                    labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                    unselectedLabelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600),
                    tabs: const [
                      Tab(text: 'Dalam Proses'),
                      Tab(text: 'Riwayat'),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabCtrl,
                  children: [
                    const _ActiveOrdersTab(),
                    const _HistoryOrdersTab(),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => DgShimmer.orderList(),
        error: (err, _) => Center(
          child: DgEmptyState(
            icon: Icons.error_outline,
            title: 'Terjadi Kesalahan',
            subtitle: 'Tidak dapat terhubung ke server. Pastikan internet Anda aktif.',
          ),
        ),
      ),
    );
  }
}

class _ActiveOrdersTab extends ConsumerWidget {
  const _ActiveOrdersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeAsync = ref.watch(activeOrdersProvider);

    return activeAsync.when(
      data: (orders) => _OrderList(orders: orders, emptyMsg: 'Belum ada pesanan aktif'),
      loading: () => DgShimmer.orderList(),
      error: (err, _) {
        final isUnauthorized = err.toString().contains('401');
        return Center(
          child: DgEmptyState(
            icon: isUnauthorized ? Icons.lock_clock_outlined : Icons.wifi_off_outlined,
            title: isUnauthorized ? 'Sesi Habis' : 'Gagal Memuat Pesanan',
            subtitle: isUnauthorized
                ? 'Sesi Anda telah berakhir. Silakan masuk kembali untuk melihat pesanan.'
                : 'Terjadi gangguan koneksi. Silakan coba beberapa saat lagi.',
          ),
        );
      },
    );
  }
}

class _HistoryOrdersTab extends ConsumerWidget {
  const _HistoryOrdersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(orderHistoryProvider);

    return historyAsync.when(
      data: (orders) => _OrderList(orders: orders, emptyMsg: 'Belum ada riwayat pesanan'),
      loading: () => DgShimmer.orderList(),
      error: (err, _) {
        final isUnauthorized = err.toString().contains('401');
        return Center(
          child: DgEmptyState(
            icon: isUnauthorized ? Icons.lock_clock_outlined : Icons.wifi_off_outlined,
            title: isUnauthorized ? 'Sesi Habis' : 'Gagal Memuat Riwayat',
            subtitle: isUnauthorized
                ? 'Sesi Anda telah berakhir. Silakan masuk kembali untuk melihat riwayat.'
                : 'Terjadi gangguan koneksi. Silakan coba beberapa saat lagi.',
          ),
        );
      },
    );
  }
}

class _OrderList extends StatelessWidget {
  const _OrderList({required this.orders, required this.emptyMsg});
  final List<Order> orders;
  final String emptyMsg;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom + 90;

    if (orders.isEmpty) {
      return DgEmptyState(
        icon: Icons.receipt_long_outlined,
        title: emptyMsg,
        subtitle: 'Yuk mulai belanja bahan dapur sehat!',
      );
    }

    return ListView.separated(
      padding: EdgeInsets.fromLTRB(16, 16, 16, bottomPadding),
      itemCount: orders.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final o = orders[i];
        
        // build items string
        String itemsText = (o.items ?? []).map((e) => e.productSnapshot?['name'] ?? 'Item').join(', ');
        
        return RepaintBoundary(
          child: GestureDetector(
            onTap: () => context.push('/orders/${o.id}'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 4)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Icon + Date + Status
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: AppColors.primarySurface,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.shopping_bag_outlined,
                          color: AppColors.primaryAction,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Pesanan #${o.code}',
                              style: AppTypography.labelLarge.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryDark,
                              ),
                            ),
                            Text(
                              DateFormatter.date(o.createdAt),
                              style: AppTypography.caption.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      DgStatusBadge(status: o.orderStatus),
                    ],
                  ),
                  
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(height: 1, color: AppColors.divider),
                  ),
                  
                  // Body: Item names and Total
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              itemsText,
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${o.items?.length ?? 0} produk',
                              style: AppTypography.caption.copyWith(
                                color: AppColors.textHint,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Total',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Text(
                            CurrencyFormatter.format(o.grandTotal),
                            style: AppTypography.labelLarge.copyWith(
                              color: AppColors.primaryDark,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
