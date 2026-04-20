import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/constants/enums.dart';

class DriverOrderDetailScreen extends StatefulWidget {
  const DriverOrderDetailScreen({super.key, required this.orderId});
  final String orderId;
  @override
  State<DriverOrderDetailScreen> createState() => _DriverOrderDetailScreenState();
}

class _DriverOrderDetailScreenState extends State<DriverOrderDetailScreen> {
  String _status = 'IN_DELIVERY';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Detail Pesanan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Status
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(16)),
              child: Column(children: [
                const Icon(Icons.local_shipping, size: 40, color: AppColors.textOnPrimary),
                const SizedBox(height: 8),
                Text('Menuju Lokasi', style: AppTypography.h3.copyWith(color: AppColors.textOnPrimary)),
              ]),
            ),
            const SizedBox(height: 16),

            // Customer info
            _Card(children: [
              Text('Info Penerima', style: AppTypography.h4),
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.person, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Text('Budi Santoso', style: AppTypography.labelLarge),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.phone, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Text('0812-xxxx-xxxx', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
              ]),
              const SizedBox(height: 6),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.location_on, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text('Jl. Sudirman No. 15, Jakarta Pusat', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary))),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: DgButton(label: 'WhatsApp', icon: Icons.chat, isOutlined: true, onPressed: () {})),
                const SizedBox(width: 8),
                Expanded(child: DgButton(label: 'Navigasi', icon: Icons.navigation, isOutlined: true, onPressed: () {})),
              ]),
            ]),
            const SizedBox(height: 12),

            // Items
            _Card(children: [
              Text('Items', style: AppTypography.h4),
              const SizedBox(height: 8),
              _ItemRow('✅', 'Brokoli Segar × 2', 'Rp 30.000'),
              _ItemRow('✅', 'Apel Fuji × 1', 'Rp 29.000'),
              _ItemRow('✅', 'Dada Ayam × 1', 'Rp 39.000'),
              const Divider(height: 16),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Total + Ongkir', style: AppTypography.h4),
                Text('Rp 93.000', style: AppTypography.h4.copyWith(color: AppColors.priceActive)),
              ]),
              const SizedBox(height: 4),
              Text('Pembayaran: COD', style: AppTypography.bodySmall.copyWith(color: AppColors.warning)),
            ]),
            const SizedBox(height: 80),
          ],
        ),
      ),

      // Action buttons
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        decoration: BoxDecoration(color: AppColors.surface, boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 8, offset: const Offset(0, -2))]),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: DgButton(
                  label: 'Laporkan Masalah',
                  isOutlined: true,
                  icon: Icons.warning_amber,
                  onPressed: () => _showProblemSheet(context),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DgButton(
                  label: _status == 'IN_DELIVERY' ? 'Sampai Tujuan' : 'Selesai',
                  icon: Icons.check_circle,
                  onPressed: () {
                    if (_status == 'IN_DELIVERY') {
                      setState(() => _status = 'DELIVERED');
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload bukti foto pengiriman'), backgroundColor: AppColors.primary));
                    } else {
                      context.go('/home');
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showProblemSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Laporkan Masalah', style: AppTypography.h3),
            const SizedBox(height: 16),
            ...ProblemType.values.map((p) => ListTile(
              leading: Text(p.emoji, style: const TextStyle(fontSize: 20)),
              title: Text(p.label),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Masalah "${p.label}" dilaporkan'), backgroundColor: AppColors.warning));
              },
            )),
          ],
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)]),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
  );
}

class _ItemRow extends StatelessWidget {
  const _ItemRow(this.check, this.name, this.price);
  final String check, name, price;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(children: [
      Text(check, style: const TextStyle(fontSize: 14)),
      const SizedBox(width: 8),
      Expanded(child: Text(name, style: AppTypography.bodyMedium)),
      Text(price, style: AppTypography.labelLarge),
    ]),
  );
}
