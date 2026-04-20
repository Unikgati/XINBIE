import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/constants/enums.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
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
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Pesanan Saya'),
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: const [
            Tab(text: 'Aktif'),
            Tab(text: 'Riwayat'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _OrderList(orders: _mockActive, emptyMsg: 'Belum ada pesanan aktif'),
          _OrderList(orders: _mockHistory, emptyMsg: 'Belum ada riwayat pesanan'),
        ],
      ),
    );
  }
}

class _OrderList extends StatelessWidget {
  const _OrderList({required this.orders, required this.emptyMsg});
  final List<_MockOrder> orders;
  final String emptyMsg;

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return DgEmptyState(
        icon: Icons.receipt_long_outlined,
        title: emptyMsg,
        actionLabel: 'Belanja Sekarang',
        onAction: () => context.go('/home'),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final o = orders[i];
        return GestureDetector(
          onTap: () => context.push('/order/${o.id}'),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(o.code, style: AppTypography.labelLarge),
                    DgStatusBadge(status: o.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(o.items, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(o.date, style: AppTypography.caption.copyWith(color: AppColors.textHint)),
                    Text('Rp ${o.total}', style: AppTypography.labelLarge.copyWith(color: AppColors.priceActive)),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MockOrder {
  final String id, code, items, date, total;
  final OrderStatus status;
  const _MockOrder(this.id, this.code, this.items, this.date, this.total, this.status);
}

final _mockActive = [
  const _MockOrder('1', 'DG-260420-1234', 'Brokoli Segar, Apel Fuji, +1 lainnya', '20 Apr 2026', '88.000', OrderStatus.processing),
  const _MockOrder('2', 'DG-260420-5678', 'Ayam Kampung Utuh', '20 Apr 2026', '85.000', OrderStatus.inDelivery),
];

final _mockHistory = [
  const _MockOrder('3', 'DG-260419-9999', 'Beras Organik, Minyak Goreng', '19 Apr 2026', '117.000', OrderStatus.completed),
];
