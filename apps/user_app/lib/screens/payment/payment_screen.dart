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

    // Listen to WebSocket for real-time payment update
    final socket = ref.read(socketServiceProvider);
    socket.onPaymentUpdate((data) {
      if (data['orderId'] == widget.orderId) {
        if (data['status'] == 'PAID' && mounted) {
          context.go('/payment-success/${widget.orderId}');
        } else {
          _loadOrder();
        }
      }
    });
  }

  @override
  void dispose() {
    ref.read(socketServiceProvider).offPaymentUpdate();
    super.dispose();
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
        context.go('/payment-success/${widget.orderId}');
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

  // ─── Logo mapping from payment method enum ───
  String? _getLogoAsset(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.vaBca: return 'assets/images/payments/bca.png';
      case PaymentMethod.vaMandiri: return 'assets/images/payments/mandiri.png';
      case PaymentMethod.vaBni: return 'assets/images/payments/bni.png';
      case PaymentMethod.vaBri: return 'assets/images/payments/bri.png';
      case PaymentMethod.vaPermata: return 'assets/images/payments/permata.png';
      case PaymentMethod.vaCimb: return 'assets/images/payments/cimb.png';
      case PaymentMethod.gopay: return 'assets/images/payments/gopay.png';
      case PaymentMethod.shopeepay: return 'assets/images/payments/shopeepay.png';
      case PaymentMethod.qris: return 'assets/images/payments/qris.png';
      case PaymentMethod.alfamart: return 'assets/images/payments/alfamart.png';
      case PaymentMethod.indomaret: return 'assets/images/payments/indomaret.png';
      default: return null;
    }
  }

  String _getMethodName(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.vaBca: return 'BCA Virtual Account';
      case PaymentMethod.vaMandiri: return 'Mandiri Virtual Account';
      case PaymentMethod.vaBni: return 'BNI Virtual Account';
      case PaymentMethod.vaBri: return 'BRI Virtual Account';
      case PaymentMethod.vaPermata: return 'Permata Virtual Account';
      case PaymentMethod.vaCimb: return 'CIMB Virtual Account';
      case PaymentMethod.gopay: return 'GoPay';
      case PaymentMethod.shopeepay: return 'ShopeePay';
      case PaymentMethod.qris: return 'QRIS';
      case PaymentMethod.alfamart: return 'Alfamart';
      case PaymentMethod.indomaret: return 'Indomaret';
      case PaymentMethod.cod: return 'Bayar di Tempat';
      default: return method.name;
    }
  }

  // ─── Step-by-step instructions per payment type ───
  List<String> _getInstructions(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.vaBca:
      case PaymentMethod.vaMandiri:
      case PaymentMethod.vaBni:
      case PaymentMethod.vaBri:
      case PaymentMethod.vaPermata:
      case PaymentMethod.vaCimb:
      case PaymentMethod.va:
        final bankName = _getMethodName(method).replaceAll(' Virtual Account', '');
        return [
          'Buka aplikasi M-Banking atau ATM $bankName.',
          'Pilih menu Transfer > Virtual Account.',
          'Masukkan nomor Virtual Account di atas.',
          'Masukkan jumlah pembayaran sesuai tagihan.',
          'Konfirmasi dan selesaikan pembayaran.',
          'Pembayaran akan terkonfirmasi otomatis.',
        ];
      case PaymentMethod.gopay:
        return [
          'Buka aplikasi Gojek di ponsel Anda.',
          'Pilih menu Bayar atau scan QR Code di atas.',
          'Konfirmasi pembayaran di aplikasi Gojek.',
          'Pembayaran akan terkonfirmasi otomatis.',
        ];
      case PaymentMethod.shopeepay:
        return [
          'Buka aplikasi Shopee di ponsel Anda.',
          'Scan QR Code di atas menggunakan ShopeePay.',
          'Konfirmasi pembayaran di aplikasi Shopee.',
          'Pembayaran akan terkonfirmasi otomatis.',
        ];
      case PaymentMethod.qris:
        return [
          'Buka aplikasi E-Wallet atau M-Banking Anda.',
          'Pilih menu Scan QR / Bayar.',
          'Scan QR Code yang tertera di atas.',
          'Konfirmasi pembayaran di aplikasi Anda.',
          'Pembayaran akan terkonfirmasi otomatis.',
        ];
      case PaymentMethod.alfamart:
        return [
          'Catat atau salin kode pembayaran di atas.',
          'Kunjungi gerai Alfamart terdekat.',
          'Beritahu kasir untuk pembayaran "Midtrans".',
          'Berikan kode pembayaran kepada kasir.',
          'Bayar sesuai jumlah tagihan.',
          'Simpan struk sebagai bukti pembayaran.',
        ];
      case PaymentMethod.indomaret:
        return [
          'Catat atau salin kode pembayaran di atas.',
          'Kunjungi gerai Indomaret terdekat.',
          'Beritahu kasir untuk pembayaran "Midtrans".',
          'Berikan kode pembayaran kepada kasir.',
          'Bayar sesuai jumlah tagihan.',
          'Simpan struk sebagai bukti pembayaran.',
        ];
      default:
        return ['Selesaikan pembayaran sesuai instruksi.'];
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text('Pembayaran', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
        ),
        body: DgShimmer.payment(),
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
    final paymentMethod = _order!.paymentMethod;

    Widget paymentWidget = const SizedBox();
    String deepLinkUrl = '';
    String codeForCopy = '';

    // ─── Logo widget ───
    final logoAsset = _getLogoAsset(paymentMethod);
    Widget logoWidget = logoAsset != null
        ? Image.asset(logoAsset, height: 32, errorBuilder: (_, __, ___) => const SizedBox())
        : const SizedBox();

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
        codeForCopy = vaNumber;

        paymentWidget = Column(
          children: [
            logoWidget,
            const SizedBox(height: 12),
            Text(_getMethodName(paymentMethod), style: AppTypography.labelLarge.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            Text(
              vaNumber,
              textAlign: TextAlign.center,
              style: AppTypography.h4.copyWith(
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () => _copyToClipboard(vaNumber),
              icon: Icon(_isCopied ? Icons.check : Icons.copy, size: 14, color: AppColors.primary),
              label: Text(_isCopied ? 'Tersalin' : 'Salin', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13)),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.primarySurface,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
            logoWidget,
            const SizedBox(height: 16),
            if (qrUrl.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10),
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
              const SizedBox(height: 12),
              if (_isDownloading)
                const CircularProgressIndicator()
              else
                TextButton.icon(
                  onPressed: () => _downloadQr(qrUrl),
                  icon: const Icon(Icons.download, color: AppColors.primary, size: 18),
                  label: const Text('Simpan QR Code', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                ),
            ] else if (deepLinkUrl.isEmpty) ...[
              const Text('Metode pembayaran sedang diproses.'),
            ],
          ],
        );
      } else if (paymentType == 'cstore') {
        // Convenience Store (Alfamart / Indomaret)
        String paymentCode = details['payment_code']?.toString() ?? '';
        codeForCopy = paymentCode;

        paymentWidget = Column(
          children: [
            logoWidget,
            const SizedBox(height: 12),
            Text(_getMethodName(paymentMethod), style: AppTypography.labelLarge.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            Text(
              paymentCode,
              textAlign: TextAlign.center,
              style: AppTypography.h4.copyWith(
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () => _copyToClipboard(paymentCode),
              icon: Icon(_isCopied ? Icons.check : Icons.copy, size: 14, color: AppColors.primary),
              label: Text(_isCopied ? 'Tersalin' : 'Salin Kode', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13)),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.primarySurface,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        );
      } else {
        paymentWidget = Column(
          children: [
            logoWidget,
            const SizedBox(height: 16),
            Text('Menunggu pembayaran via $paymentType'),
          ],
        );
      }
    }

    // Build instructions
    final instructions = _getInstructions(paymentMethod);

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
            // ─── Payment card ───
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
                  const SizedBox(height: 24),
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

            // ─── Payment instructions ───
            if (!isPaid) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cara Pembayaran',
                      style: AppTypography.h4.copyWith(color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 16),
                    ...instructions.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final step = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                color: AppColors.primarySurface,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  '${idx + 1}',
                                  style: AppTypography.bodySmall.copyWith(
                                    color: AppColors.primaryDark,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                step,
                                style: AppTypography.bodyMedium.copyWith(
                                  color: AppColors.textPrimary,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
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
                  label: 'Buka Aplikasi ${_getMethodName(paymentMethod)}',
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
