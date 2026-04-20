import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _paymentMethod = 'QRIS';
  String _deliveryType = 'REGULAR';
  final _promoCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _promoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Address section
            _Section(
              title: 'Alamat Pengiriman',
              trailing: TextButton(onPressed: () => context.push('/addresses'), child: const Text('Ubah')),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Budi Santoso • 0812-xxxx-xxxx', style: AppTypography.labelLarge),
                        Text('Jl. Sudirman No. 15, Jakarta Pusat', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Delivery type
            _Section(
              title: 'Tipe Pengiriman',
              child: Column(
                children: [
                  _RadioTile(
                    label: 'Regular (Terjadwal)',
                    subtitle: 'Pilih jadwal pengiriman',
                    isSelected: _deliveryType == 'REGULAR',
                    onTap: () => setState(() => _deliveryType = 'REGULAR'),
                  ),
                  _RadioTile(
                    label: 'Instant',
                    subtitle: 'Dikirim sekarang • +Rp 5.000',
                    isSelected: _deliveryType == 'INSTANT',
                    onTap: () => setState(() => _deliveryType = 'INSTANT'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Payment
            _Section(
              title: 'Metode Pembayaran',
              child: Column(
                children: [
                  _RadioTile(label: 'QRIS', subtitle: 'Scan QR untuk bayar', isSelected: _paymentMethod == 'QRIS', onTap: () => setState(() => _paymentMethod = 'QRIS')),
                  _RadioTile(label: 'Virtual Account', subtitle: 'Transfer bank', isSelected: _paymentMethod == 'VA', onTap: () => setState(() => _paymentMethod = 'VA')),
                  _RadioTile(label: 'COD', subtitle: 'Bayar saat diterima', isSelected: _paymentMethod == 'COD', onTap: () => setState(() => _paymentMethod = 'COD')),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Promo code
            _Section(
              title: 'Kode Promo',
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _promoCtrl,
                      decoration: const InputDecoration(hintText: 'Masukkan kode promo', isDense: true),
                    ),
                  ),
                  const SizedBox(width: 8),
                  DgButton(
                    label: 'Pakai',
                    isFullWidth: false,
                    size: DgButtonSize.small,
                    onPressed: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Order summary
            _Section(
              title: 'Ringkasan Pesanan',
              child: Column(
                children: [
                  _SummaryRow('Subtotal (3 item)', 'Rp 83.000'),
                  _SummaryRow('Ongkir', _deliveryType == 'INSTANT' ? 'Rp 10.000' : 'Rp 5.000'),
                  _SummaryRow('Diskon', '-Rp 0'),
                  const Divider(height: 16),
                  _SummaryRow('Total', _deliveryType == 'INSTANT' ? 'Rp 93.000' : 'Rp 88.000', isBold: true),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 8, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: DgButton(
            label: 'Buat Pesanan',
            isLoading: _loading,
            onPressed: () {
              setState(() => _loading = true);
              Future.delayed(const Duration(seconds: 1), () {
                if (mounted) {
                  setState(() => _loading = false);
                  context.go('/orders');
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Pesanan berhasil dibuat! 🎉'), backgroundColor: AppColors.primary),
                  );
                }
              });
            },
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.trailing});
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
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
              Text(title, style: AppTypography.h4),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _RadioTile extends StatelessWidget {
  const _RadioTile({required this.label, required this.subtitle, required this.isSelected, required this.onTap});
  final String label;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary : AppColors.textHint,
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: AppTypography.labelLarge),
                  Text(subtitle, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow(this.label, this.value, {this.isBold = false});
  final String label;
  final String value;
  final bool isBold;

  @override
  Widget build(BuildContext context) {
    final style = isBold
        ? AppTypography.h4.copyWith(color: AppColors.priceActive)
        : AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: isBold ? AppTypography.h4 : AppTypography.bodyMedium),
          Text(value, style: style),
        ],
      ),
    );
  }
}
