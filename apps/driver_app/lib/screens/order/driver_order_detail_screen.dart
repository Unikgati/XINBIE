
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class DriverOrderDetailScreen extends ConsumerStatefulWidget {
  const DriverOrderDetailScreen({super.key, required this.orderId});
  final String orderId;
  @override
  ConsumerState<DriverOrderDetailScreen> createState() => _DriverOrderDetailScreenState();
}

class _DriverOrderDetailScreenState extends ConsumerState<DriverOrderDetailScreen> {
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  bool _actionLoading = false;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    try {
      // Fetch from active orders first, fallback to history
      final activeOrders = await ref.read(driverRepositoryProvider).getActiveOrders();
      final match = activeOrders.where((o) => o['id'] == widget.orderId).toList();
      if (match.isNotEmpty) {
        if (mounted) setState(() { _order = match.first; _isLoading = false; });
        return;
      }
      // Try history
      final historyOrders = await ref.read(driverRepositoryProvider).getOrderHistory();
      final hMatch = historyOrders.where((o) => o['id'] == widget.orderId).toList();
      if (hMatch.isNotEmpty) {
        if (mounted) setState(() { _order = hMatch.first; _isLoading = false; });
        return;
      }
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        DgSnackbar.showError(context, message: 'Gagal memuat pesanan', error: e);
      }
    }
  }

  Future<void> _acceptOrder() async {
    setState(() => _actionLoading = true);
    try {
      await ref.read(driverRepositoryProvider).acceptOrder(widget.orderId);
      if (mounted) DgSnackbar.showSuccess(context, message: 'Pesanan diterima!');
      // Switch GPS to delivery mode (15s interval)
      ref.read(driverLocationServiceProvider).setMode('delivery');
      ref.invalidate(driverActiveOrdersProvider);
      await _loadOrder();
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal', error: e);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _actionLoading = true);
    try {
      await ref.read(driverRepositoryProvider).updateOrderStatus(widget.orderId, status);
      if (mounted) DgSnackbar.showSuccess(context, message: 'Status diperbarui');
      // Switch GPS back to idle when delivered
      if (status == 'DELIVERED') {
        ref.read(driverLocationServiceProvider).setMode('idle');
      }
      ref.invalidate(driverActiveOrdersProvider);
      ref.invalidate(driverEarningsProvider(null));
      await _loadOrder();
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal', error: e);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _uploadProof() async {
    final picked = await _picker.pickImage(source: ImageSource.camera, maxWidth: 800, imageQuality: 85);
    if (picked == null) return;

    setState(() => _actionLoading = true);
    try {
      await ref.read(driverRepositoryProvider).uploadDeliveryProof(widget.orderId, picked.path);
      if (mounted) DgSnackbar.showSuccess(context, message: 'Bukti foto berhasil diupload');
      await _loadOrder();
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal upload', error: e);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _confirmCod() async {
    final grandTotal = _order?['grandTotal'] as int? ?? 0;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Konfirmasi COD'),
        content: Text('Uang sebesar Rp ${grandTotal.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')} sudah diterima dari pelanggan?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Ya, Sudah Diterima'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _actionLoading = true);
    try {
      await ref.read(driverRepositoryProvider).confirmCod(widget.orderId, amount: grandTotal.toDouble());
      if (mounted) DgSnackbar.showSuccess(context, message: 'COD dikonfirmasi');
      await _loadOrder();
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal', error: e);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  void _openMaps() {
    final addr = _order?['addressSnapshot'] as Map<String, dynamic>? ?? {};
    final lat = addr['lat'];
    final lng = addr['lng'];
    if (lat != null && lng != null) {
      launchUrl(Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng'), mode: LaunchMode.externalApplication);
    } else {
      DgSnackbar.showError(context, message: 'Koordinat tidak tersedia');
    }
  }

  void _openWhatsApp() {
    final addr = _order?['addressSnapshot'] as Map<String, dynamic>? ?? {};
    final phone = addr['phoneWa'] as String? ?? '';
    if (phone.isNotEmpty) {
      final wa = WaDeeplink.build(phone, message: 'Halo, saya driver Dapur Gizi. Pesanan Anda sedang dalam perjalanan.');
      launchUrl(Uri.parse(wa), mode: LaunchMode.externalApplication);
    }
  }

  void _showProblemSheet() {
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
              onTap: () async {
                Navigator.pop(context);
                setState(() => _actionLoading = true);
                try {
                  await ref.read(driverRepositoryProvider).reportProblem(
                    widget.orderId,
                    type: p.name,
                    description: p.label,
                  );
                  if (mounted) DgSnackbar.showSuccess(context, message: 'Masalah dilaporkan');
                  ref.invalidate(driverActiveOrdersProvider);
                  await _loadOrder();
                } catch (e) {
                  if (mounted) DgSnackbar.showError(context, message: 'Gagal', error: e);
                } finally {
                  if (mounted) setState(() => _actionLoading = false);
                }
              },
            )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Detail Pesanan')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            DgShimmer(width: double.infinity, height: 100, borderRadius: 16),
            const SizedBox(height: 16),
            DgShimmer(width: double.infinity, height: 160, borderRadius: 16),
            const SizedBox(height: 16),
            DgShimmer(width: double.infinity, height: 120, borderRadius: 16),
          ]),
        ),
      );
    }

    if (_order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detail Pesanan')),
        body: const Center(child: Text('Pesanan tidak ditemukan')),
      );
    }

    final o = _order!;
    final orderStatus = o['orderStatus'] as String? ?? '';
    final paymentMethod = o['paymentMethod'] as String? ?? '';
    final paymentStatus = o['paymentStatus'] as String? ?? '';
    final addr = o['addressSnapshot'] as Map<String, dynamic>? ?? {};
    final items = (o['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final grandTotal = o['grandTotal'] as int? ?? 0;
    final deliveryFee = o['deliveryFee'] as int? ?? 0;
    final subtotal = o['subtotal'] as int? ?? 0;
    final code = o['code'] as String? ?? '';
    final proofUrl = o['proofPhotoUrl'] as String?;

    String statusLabel;
    IconData statusIcon;
    switch (orderStatus) {
      case 'WAITING_DRIVER': statusLabel = 'Menunggu Diambil'; statusIcon = Icons.access_time;
      case 'IN_DELIVERY': statusLabel = 'Menuju Lokasi'; statusIcon = Icons.local_shipping;
      case 'DELIVERED': statusLabel = 'Terkirim'; statusIcon = Icons.check_circle;
      case 'COMPLETED': statusLabel = 'Selesai'; statusIcon = Icons.done_all;
      case 'PROBLEM': statusLabel = 'Bermasalah'; statusIcon = Icons.warning;
      default: statusLabel = orderStatus; statusIcon = Icons.info;
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(code)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(16)),
            child: Column(children: [
              Icon(statusIcon, size: 40, color: AppColors.textOnPrimary),
              const SizedBox(height: 8),
              Text(statusLabel, style: AppTypography.h3.copyWith(color: AppColors.textOnPrimary)),
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
              Text(addr['recipientName'] as String? ?? '-', style: AppTypography.labelLarge),
            ]),
            const SizedBox(height: 6),
            Row(children: [
              const Icon(Icons.phone, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              Text(addr['phoneWa'] as String? ?? '-', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
            ]),
            const SizedBox(height: 6),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.location_on, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(addr['fullAddress'] as String? ?? '-', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary))),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: DgButton(label: 'WhatsApp', icon: Icons.chat, isOutlined: true, onPressed: _openWhatsApp)),
              const SizedBox(width: 8),
              Expanded(child: DgButton(label: 'Navigasi', icon: Icons.navigation, isOutlined: true, onPressed: _openMaps)),
            ]),
          ]),
          const SizedBox(height: 12),

          // Items
          _Card(children: [
            Text('Item Pesanan', style: AppTypography.h4),
            const SizedBox(height: 8),
            ...items.map((item) {
              final name = item['productName'] as String? ?? item['name'] as String? ?? 'Item';
              final qty = item['quantity'] as int? ?? 1;
              final price = item['price'] as int? ?? 0;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(children: [
                  const Text('✅', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 8),
                  Expanded(child: Text('$name × $qty', style: AppTypography.bodyMedium)),
                  Text('Rp ${(price * qty).toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}', style: AppTypography.labelLarge),
                ]),
              );
            }),
            const Divider(height: 16),
            _SummaryRow('Subtotal', subtotal),
            _SummaryRow('Ongkir', deliveryFee),
            const SizedBox(height: 4),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Total', style: AppTypography.h4),
              Text('Rp ${grandTotal.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}', style: AppTypography.h4.copyWith(color: AppColors.priceActive)),
            ]),
            const SizedBox(height: 4),
            Text(
              'Pembayaran: ${paymentMethod == 'COD' ? 'COD' : paymentMethod} (${paymentStatus == 'PAID' ? 'Lunas' : 'Belum'})',
              style: AppTypography.bodySmall.copyWith(color: paymentMethod == 'COD' ? AppColors.warning : AppColors.primary),
            ),
          ]),

          // Proof photo
          if (proofUrl != null) ...[
            const SizedBox(height: 12),
            _Card(children: [
              Text('Bukti Pengiriman', style: AppTypography.h4),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(AppConfig.fixImageUrl(proofUrl), height: 200, width: double.infinity, fit: BoxFit.cover),
              ),
            ]),
          ],

          const SizedBox(height: 80),
        ]),
      ),

      // Action buttons
      bottomNavigationBar: (orderStatus == 'COMPLETED' || orderStatus == 'PROBLEM')
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 8, offset: const Offset(0, -2))],
              ),
              child: SafeArea(
                child: _actionLoading
                    ? const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()))
                    : _buildActions(orderStatus, paymentMethod),
              ),
            ),
    );
  }

  Widget _buildActions(String status, String paymentMethod) {
    switch (status) {
      case 'WAITING_DRIVER':
        return DgButton(label: 'Terima Pesanan', icon: Icons.check_circle, onPressed: _acceptOrder);
      case 'IN_DELIVERY':
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (paymentMethod == 'COD')
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: DgButton(label: 'Konfirmasi COD', icon: Icons.payments, isOutlined: true, onPressed: _confirmCod),
              ),
            Row(children: [
              Expanded(child: DgButton(label: 'Masalah', isOutlined: true, icon: Icons.warning_amber, onPressed: _showProblemSheet)),
              const SizedBox(width: 12),
              Expanded(child: DgButton(label: 'Foto Bukti', icon: Icons.camera_alt, isOutlined: true, onPressed: _uploadProof)),
            ]),
            const SizedBox(height: 8),
            DgButton(label: 'Sampai Tujuan', icon: Icons.check_circle, onPressed: () => _updateStatus('DELIVERED')),
          ],
        );
      case 'DELIVERED':
        return DgButton(label: 'Selesai', icon: Icons.done_all, onPressed: () {
          ref.invalidate(driverActiveOrdersProvider);
          ref.invalidate(driverEarningsProvider(null));
          context.go('/home');
        });
      default:
        return const SizedBox();
    }
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow(this.label, this.amount);
  final String label;
  final int amount;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
      Text('Rp ${amount.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}', style: AppTypography.bodySmall),
    ]),
  );
}
