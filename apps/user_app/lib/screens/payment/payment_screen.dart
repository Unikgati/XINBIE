import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:typed_data';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:gal/gal.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/order_provider.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final String orderId;

  const PaymentScreen({super.key, required this.orderId});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  Order? _order;
  bool _isLoading = true;
  bool _isChecking = false;
  bool _isDownloading = false;
  bool _isCopied = false;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    try {
      final order = await ref.read(orderRepositoryProvider).getOrder(widget.orderId);
      if (mounted) {
        setState(() {
          _order = order;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        DgSnackbar.showError(context, message: e.toString());
      }
    }
  }

  Future<void> _checkStatus() async {
    setState(() => _isChecking = true);
    await _loadOrder();
    setState(() => _isChecking = false);

    if (_order != null && _order!.paymentStatus == PaymentStatus.paid) {
      if (mounted) {
        DgSnackbar.showSuccess(context, message: 'Pembayaran Berhasil!');
        context.go('/orders');
      }
    } else {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Pembayaran belum diterima.');
      }
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    setState(() => _isCopied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isCopied = false);
    });
    if (mounted) {
      DgSnackbar.showSuccess(context, message: 'Disalin ke clipboard');
    }
  }

  Future<void> _downloadQr(String url) async {
    setState(() => _isDownloading = true);
    try {
      final hasAccess = await Gal.hasAccess();
      if (!hasAccess) {
        final granted = await Gal.requestAccess();
        if (!granted) {
          if (mounted) {
            DgSnackbar.showError(context, message: 'Izin galeri ditolak.');
            setState(() => _isDownloading = false);
          }
          return;
        }
      }

      final response = await Dio().get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
      );
      
      final Uint8List bytes = Uint8List.fromList(response.data!);
      await Gal.putImageBytes(bytes);

      if (mounted) {
        DgSnackbar.showSuccess(context, message: 'QR Code berhasil disimpan ke galeri!');
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal menyimpan: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_order == null) {
      return Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text('Pembayaran', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
        ),
        body: const Center(child: Text('Pesanan tidak ditemukan')),
      );
    }

    final isPaid = _order!.paymentStatus == PaymentStatus.paid;
    final details = _order!.paymentDetails;
    final paymentType = _order!.midtransPaymentType ?? '';

    Widget paymentWidget = const SizedBox();
    String deepLinkUrl = '';

    if (!isPaid && details != null) {
      if (paymentType == 'bank_transfer' || paymentType == 'echannel') {
        // VA
        String bank = '';
        String vaNumber = '';
        
        if (details['va_numbers'] != null && (details['va_numbers'] as List).isNotEmpty) {
          bank = details['va_numbers'][0]['bank']?.toString().toUpperCase() ?? '';
          vaNumber = details['va_numbers'][0]['va_number']?.toString() ?? '';
        } else if (details['permata_va_number'] != null) {
          bank = 'PERMATA';
          vaNumber = details['permata_va_number'].toString();
        } else if (details['bill_key'] != null) {
          bank = 'MANDIRI BILL';
          vaNumber = '${details['biller_code']} - ${details['bill_key']}';
        }

        paymentWidget = Column(
          children: [
            const Icon(Icons.account_balance, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Transfer Bank $bank', style: AppTypography.labelLarge.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            Text(
              vaNumber,
              textAlign: TextAlign.center,
              style: AppTypography.h3.copyWith(
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () => _copyToClipboard(vaNumber),
              icon: Icon(_isCopied ? Icons.check : Icons.copy, size: 18, color: AppColors.primary),
              label: const Text('Salin', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.primarySurface,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
            ),
          ],
        );
      } else if (['gopay', 'qris', 'shopeepay', 'ovo', 'dana'].contains(paymentType)) {
        // E-Wallets & QRIS
        String qrUrl = '';
        
        if (details['actions'] != null) {
          final actions = details['actions'] as List;
          final qrAction = actions.firstWhere((a) => a['name'] == 'generate-qr-code', orElse: () => null);
          if (qrAction != null) {
            qrUrl = qrAction['url']?.toString() ?? '';
          }
          final dlAction = actions.firstWhere((a) => a['name'] == 'deeplink-redirect' || a['name'] == 'mobile-web', orElse: () => null);
          if (dlAction != null) {
            deepLinkUrl = dlAction['url']?.toString() ?? '';
          }
        }

        paymentWidget = Column(
          children: [
            Icon(qrUrl.isNotEmpty ? Icons.qr_code_2 : Icons.account_balance_wallet, size: 48, color: AppColors.primary),
            const SizedBox(height: 16),
            if (qrUrl.isNotEmpty && deepLinkUrl.isNotEmpty)
              const Text('Lanjutkan pembayaran melalui aplikasi E-Wallet Anda, atau scan QR Code berikut:', textAlign: TextAlign.center)
            else if (deepLinkUrl.isNotEmpty)
              const Text('Silakan tekan tombol di bawah untuk melanjutkan pembayaran.', textAlign: TextAlign.center)
            else if (qrUrl.isNotEmpty)
              const Text('Scan QR Code menggunakan aplikasi e-Wallet / M-Banking Anda', textAlign: TextAlign.center),
            const SizedBox(height: 24),

            if (qrUrl.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10),
                  ],
                ),
                child: CachedNetworkImage(
                  imageUrl: qrUrl,
                  width: 200,
                  height: 200,
                  placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                  errorWidget: (context, url, error) => const Icon(Icons.error),
                ),
              ),
              const SizedBox(height: 16),
              if (_isDownloading)
                const CircularProgressIndicator()
              else
                TextButton.icon(
                  onPressed: () => _downloadQr(qrUrl),
                  icon: const Icon(Icons.download, color: AppColors.primary),
                  label: const Text('Download QR Code', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                ),
            ] else if (deepLinkUrl.isEmpty) ...[
              const Text('Metode pembayaran sedang diproses.'),
            ],
          ],
        );
      } else {
        paymentWidget = Text('Menunggu pembayaran via $paymentType');
      }
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text('Menunggu Pembayaran', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text('Total Tagihan', style: AppTypography.labelLarge.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Text(
                    'Rp ${_order!.grandTotal.toString().replaceAll(RegExp(r'\B(?=(\d{3})+(?!\d))'), '.')}',
                    style: AppTypography.h3.copyWith(
                      color: AppColors.primaryDark,
                      fontWeight: FontWeight.bold,
                      fontSize: 28,
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (isPaid)
                    const Column(
                      children: [
                        Icon(Icons.check_circle, color: Colors.green, size: 64),
                        SizedBox(height: 16),
                        Text('Pembayaran Berhasil', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
                      ],
                    )
                  else
                    paymentWidget,
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (!isPaid) ...[
              if (deepLinkUrl.isNotEmpty) ...[
                DgButton(
                  onPressed: () async {
                    final uri = Uri.parse(deepLinkUrl);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    } else {
                      if (mounted) DgSnackbar.showError(context, message: 'Tidak dapat membuka aplikasi.');
                    }
                  },
                  icon: Icons.open_in_new,
                  label: 'Buka Aplikasi ${paymentType.toUpperCase()}',
                ),
                const SizedBox(height: 16),
              ],
              Row(
                children: [
                  Expanded(
                    child: DgButton(
                      label: 'Riwayat',
                      isOutlined: true,
                      onPressed: () {
                        ref.invalidate(activeOrdersProvider);
                        ref.invalidate(orderHistoryProvider);
                        context.go('/orders');
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DgButton(
                      label: 'Cek Status',
                      isLoading: _isChecking,
                      onPressed: _checkStatus,
                    ),
                  ),
                ],
              ),
            ] else ...[
              DgButton(
                label: 'Kembali ke Daftar Pesanan',
                onPressed: () {
                  ref.invalidate(activeOrdersProvider);
                  ref.invalidate(orderHistoryProvider);
                  context.go('/orders');
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
