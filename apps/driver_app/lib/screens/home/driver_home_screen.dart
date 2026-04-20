import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/constants/enums.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});
  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _isOnline = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              color: AppColors.surface,
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(radius: 24, backgroundColor: AppColors.primarySurface, child: const Icon(Icons.person, color: AppColors.primary)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Halo, Driver! 👋', style: AppTypography.h4),
                            Text('⭐ 4.8 • 50 order', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Online toggle
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: _isOnline ? AppColors.primarySurface : AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _isOnline ? AppColors.primary : AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(children: [
                          Container(width: 12, height: 12, decoration: BoxDecoration(
                            color: _isOnline ? AppColors.success : AppColors.textHint, shape: BoxShape.circle)),
                          const SizedBox(width: 8),
                          Text(_isOnline ? 'Sedang Online' : 'Kamu Offline', style: AppTypography.labelLarge.copyWith(
                            color: _isOnline ? AppColors.primaryDark : AppColors.textSecondary)),
                        ]),
                        Switch(
                          value: _isOnline,
                          activeColor: AppColors.primary,
                          onChanged: (v) => setState(() => _isOnline = v),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Stats
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _StatCard('Hari Ini', '3', 'pesanan', Icons.receipt_long, AppColors.primary),
                  const SizedBox(width: 12),
                  _StatCard('Pendapatan', 'Rp 45K', 'hari ini', Icons.account_balance_wallet, AppColors.warning),
                ],
              ),
            ),

            // Active orders
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Align(alignment: Alignment.centerLeft, child: Text('Pesanan Aktif', style: AppTypography.h4)),
            ),
            const SizedBox(height: 8),

            Expanded(
              child: _isOnline ? ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _OrderCard(
                    code: 'DG-260420-1234',
                    customer: 'Budi Santoso',
                    address: 'Jl. Sudirman No. 15',
                    items: '2 item • Rp 88.000',
                    status: OrderStatus.inDelivery,
                    onTap: () => context.push('/order/1'),
                  ),
                  const SizedBox(height: 12),
                  _OrderCard(
                    code: 'DG-260420-5678',
                    customer: 'Siti Rahayu',
                    address: 'Jl. Gatot Subroto Kav. 42',
                    items: '5 item • Rp 150.000',
                    status: OrderStatus.waitingDriver,
                    isNew: true,
                    onTap: () => context.push('/order/2'),
                  ),
                ],
              ) : Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off, size: 64, color: AppColors.textHint),
                    const SizedBox(height: 12),
                    Text('Kamu sedang offline', style: AppTypography.h4.copyWith(color: AppColors.textSecondary)),
                    Text('Nyalakan toggle untuk menerima pesanan', style: AppTypography.bodySmall.copyWith(color: AppColors.textHint)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(this.label, this.value, this.sub, this.icon, this.color);
  final String label, value, sub;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)]),
        child: Row(children: [
          Container(width: 40, height: 40, decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20)),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: AppTypography.h3),
            Text(sub, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
          ]),
        ]),
      ),
    );
  }
}

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
