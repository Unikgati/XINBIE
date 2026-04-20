import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Detail Pesanan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Status card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                children: [
                  const Icon(Icons.local_shipping, size: 48, color: AppColors.textOnPrimary),
                  const SizedBox(height: 12),
                  Text('Sedang Diantar', style: AppTypography.h3.copyWith(color: AppColors.textOnPrimary)),
                  const SizedBox(height: 4),
                  Text('Driver sedang menuju lokasi Anda', style: AppTypography.bodySmall.copyWith(color: AppColors.textOnPrimary.withValues(alpha: 0.8))),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Order info
            _InfoCard(children: [
              _InfoRow('Kode Pesanan', 'DG-260420-1234'),
              _InfoRow('Tanggal', '20 April 2026 · 10:30'),
              _InfoRow('Pembayaran', 'QRIS • Lunas'),
            ]),
            const SizedBox(height: 12),

            // Items
            _InfoCard(children: [
              Text('Items', style: AppTypography.h4),
              const SizedBox(height: 8),
              _ItemRow('Brokoli Segar', '2x', 'Rp 30.000'),
              _ItemRow('Apel Fuji', '1x', 'Rp 29.000'),
              _ItemRow('Dada Ayam Fillet', '1x', 'Rp 39.000'),
              const Divider(height: 16),
              _ItemRow('Subtotal', '', 'Rp 98.000'),
              _ItemRow('Ongkir', '', 'Rp 5.000'),
              _ItemRow('Diskon', '', '-Rp 15.000'),
              const Divider(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Grand Total', style: AppTypography.h4),
                    Text('Rp 88.000', style: AppTypography.h4.copyWith(color: AppColors.priceActive)),
                  ],
                ),
              ),
            ]),
            const SizedBox(height: 12),

            // Address
            _InfoCard(children: [
              Text('Alamat Pengiriman', style: AppTypography.h4),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on, color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Budi Santoso', style: AppTypography.labelLarge),
                        Text('Jl. Sudirman No. 15, Jakarta Pusat', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            ]),
            const SizedBox(height: 12),

            // Timeline
            _InfoCard(children: [
              Text('Status Pesanan', style: AppTypography.h4),
              const SizedBox(height: 12),
              _TimelineItem('Pesanan dibuat', '10:30', true),
              _TimelineItem('Pembayaran diterima', '10:31', true),
              _TimelineItem('Sedang diproses', '10:45', true),
              _TimelineItem('Dalam pengiriman', '11:20', true),
              _TimelineItem('Terkirim', '-', false),
            ]),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);
  final String label, value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
          Text(value, style: AppTypography.labelLarge),
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
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(child: Text(name, style: AppTypography.bodyMedium)),
          if (qty.isNotEmpty) Text(qty, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
          const SizedBox(width: 12),
          Text(price, style: AppTypography.labelLarge),
        ],
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem(this.label, this.time, this.done);
  final String label, time;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 20, height: 20,
              decoration: BoxDecoration(
                color: done ? AppColors.primary : AppColors.border,
                shape: BoxShape.circle,
              ),
              child: done ? const Icon(Icons.check, size: 12, color: AppColors.textOnPrimary) : null,
            ),
            Container(width: 2, height: 28, color: AppColors.border),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: AppTypography.bodyMedium.copyWith(color: done ? AppColors.textPrimary : AppColors.textHint)),
                Text(time, style: AppTypography.caption.copyWith(color: AppColors.textHint)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
