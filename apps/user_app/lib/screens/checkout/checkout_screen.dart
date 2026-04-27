import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/cart_provider.dart';
import '../../providers/user_providers.dart';
import 'widgets/schedule_bottom_sheet.dart';
import 'package:intl/intl.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String _paymentMethod = 'GOPAY'; // Default payment method
  final _promoCtrl = TextEditingController();
  bool _loading = false;
  
  late DateTime _scheduledDate;
  DeliverySlot? _deliverySlot;

  // Promo State
  String? _appliedPromoCode;
  int _promoDiscountAmount = 0;
  bool _isValidatingPromo = false;

  // Payment State
  String? _expandedPaymentGroup;

  @override
  void initState() {
    super.initState();
    // Default to H+2
    _scheduledDate = DateTime.now().add(const Duration(days: 2));

    // Auto-expand group containing current method
    if (['GOPAY', 'SHOPEEPAY', 'QRIS'].contains(_paymentMethod)) {
      _expandedPaymentGroup = 'E-Wallet';
    } else if (['VA_BCA', 'VA_MANDIRI', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'VA_CIMB'].contains(_paymentMethod)) {
      _expandedPaymentGroup = 'Transfer Bank (Virtual Account)';
    } else if (['ALFAMART', 'INDOMARET'].contains(_paymentMethod)) {
      _expandedPaymentGroup = 'Gerai Ritel';
    }
  }

  @override
  void dispose() {
    _promoCtrl.dispose();
    super.dispose();
  }

  bool get _isInstant {
    final today = DateTime.now();
    final isToday = _scheduledDate.day == today.day && _scheduledDate.month == today.month && _scheduledDate.year == today.year;
    return isToday && _deliverySlot?.id == 'INSTANT';
  }

  Future<void> _validatePromo() async {
    final code = _promoCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() => _isValidatingPromo = true);
    
    try {
      final subtotal = ref.read(cartSubtotalProvider);
      final repo = ref.read(orderRepositoryProvider);
      final res = await repo.validatePromoCode(code, subtotal);
      
      if (res['isValid'] == true) {
        setState(() {
          _appliedPromoCode = res['code'] ?? code;
          _promoDiscountAmount = res['discountAmount'] ?? 0;
        });
        if (mounted) DgSnackbar.showSuccess(context, message: res['message'] ?? 'Promo berhasil diterapkan');
      }
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal memvalidasi promo', error: e);
    } finally {
      if (mounted) setState(() => _isValidatingPromo = false);
    }
  }

  void _removePromo() {
    setState(() {
      _appliedPromoCode = null;
      _promoDiscountAmount = 0;
      _promoCtrl.clear();
    });
  }

  void _createOrder(Address address, List<CartItem> cartItems) async {
    if (cartItems.isEmpty) return;

    // Check if user has WhatsApp number
    final user = await ref.read(currentUserProvider.future);
    if (user?.phoneWa == null || (user?.phoneWa?.isEmpty ?? true)) {
      final phoneEntered = await _showPhoneWaBottomSheet();
      if (!phoneEntered) return; // User cancelled
      // Wait for fresh user data after phoneWa update
      await ref.read(currentUserProvider.future);
    }
    
    setState(() => _loading = true);
    try {
      final items = cartItems.map((c) => {
        'productId': c.productId,
        if (c.variantId != null) 'variantId': c.variantId,
        'qty': c.qty,
      }).toList();

      final orderRepo = ref.read(orderRepositoryProvider);
      final order = await orderRepo.createOrder(
        addressId: address.id,
        deliverySlotId: _isInstant ? null : _deliverySlot?.id,
        scheduledDate: _isInstant ? null : _scheduledDate,
        deliveryType: _isInstant ? 'INSTANT' : 'REGULAR',
        items: items,
        paymentMethod: _paymentMethod,
        promoCode: _appliedPromoCode,
      );

      if (mounted) {
        ref.read(cartProvider.notifier).clear();
        
        if (_paymentMethod == 'COD') {
          context.go('/orders');
          DgSnackbar.showSuccess(context, message: 'Pesanan berhasil dibuat! 🎉');
        } else {
          context.go('/payment/${order.id}');
        }
      }
    } catch (e) {
      if (mounted) {
        DgSnackbar.showError(context, message: 'Gagal membuat pesanan', error: e);
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<bool> _showPhoneWaBottomSheet() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PhoneWaSheet(authRepo: ref.read(authRepositoryProvider)),
    );

    final saved = result == true;
    if (saved) {
      ref.invalidate(currentUserProvider);
    }
    return saved;
  }

  String _formatNumber(num n) {
    return n.toInt().toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        );
  }

  Future<void> _openScheduleSheet() async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ScheduleBottomSheet(
        initialDate: _scheduledDate,
        initialSlot: _deliverySlot,
      ),
    );

    if (result != null) {
      setState(() {
        _scheduledDate = result['date'];
        _deliverySlot = result['slot'];
      });
    }
  }

  // Helper to get display name for payment method
  String _getPaymentMethodName(String code) {
    switch (code) {
      case 'GOPAY': return 'GoPay';
      case 'SHOPEEPAY': return 'ShopeePay';

      case 'QRIS': return 'QRIS';
      case 'VA_BCA': return 'BCA (VA)';
      case 'VA_MANDIRI': return 'Mandiri (VA)';
      case 'VA_BNI': return 'BNI (VA)';
      case 'VA_BRI': return 'BRI (VA)';
      case 'VA_PERMATA': return 'Permata (VA)';
      case 'VA_CIMB': return 'CIMB (VA)';
      case 'ALFAMART': return 'Alfamart';
      case 'INDOMARET': return 'Indomaret';
      case 'COD': return 'Bayar di Tempat (COD)';
      default: return code;
    }
  }

  // Helper to get icon for payment method
  IconData _getPaymentMethodIcon(String code) {
    if (code.startsWith('VA_')) return Icons.account_balance;
    if (code == 'COD') return Icons.inventory_2_outlined;
    if (code == 'QRIS') return Icons.qr_code_2;
    if (code == 'ALFAMART' || code == 'INDOMARET') return Icons.storefront;
    return Icons.account_balance_wallet; // E-Wallets
  }

  // Helper to get image URL for payment method
  String? _getPaymentMethodImageUrl(String code) {
    switch (code) {
      case 'GOPAY': return 'assets/images/payments/gopay.png';
      case 'SHOPEEPAY': return 'assets/images/payments/shopeepay.png';

      case 'QRIS': return 'assets/images/payments/qris.png';
      case 'VA_BCA': return 'assets/images/payments/bca.png';
      case 'VA_MANDIRI': return 'assets/images/payments/mandiri.png';
      case 'VA_BNI': return 'assets/images/payments/bni.png';
      case 'VA_BRI': return 'assets/images/payments/bri.png';
      case 'VA_PERMATA': return 'assets/images/payments/permata.png';
      case 'VA_CIMB': return 'assets/images/payments/cimb.png';
      case 'ALFAMART': return 'assets/images/payments/alfamart.png';
      case 'INDOMARET': return 'assets/images/payments/indomaret.png';
      case 'COD': return 'assets/images/payments/cod.png';
      default: return null;
    }
  }

  Widget _buildAccordionGroup(String title, List<String> methods) {
    final isExpanded = _expandedPaymentGroup == title;
    
    // Generate subtitle
    final methodNames = methods.map((m) => _getPaymentMethodName(m)).toList();
    String subtitle;
    if (methodNames.length <= 3) {
      subtitle = methodNames.join(', ');
    } else {
      subtitle = '${methodNames.take(3).join(', ')} +${methodNames.length - 3} lainnya';
    }

    return Column(
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _expandedPaymentGroup = isExpanded ? null : title;
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Icon(
                  isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
        ),
        if (isExpanded)
          Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Column(
              children: methods.map((method) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _SelectableCard(
                  title: _getPaymentMethodName(method),
                  iconData: _getPaymentMethodIcon(method),
                  imageUrl: _getPaymentMethodImageUrl(method),
                  isSelected: _paymentMethod == method,
                  onTap: () {
                    setState(() => _paymentMethod = method);
                  },
                ),
              )).toList(),
            ),
          ),
        const Divider(height: 1),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartProvider);
    final addressesAsync = ref.watch(addressesProvider);
    final subtotal = ref.watch(cartSubtotalProvider);

    // Empty Cart Protection
    if (cartItems.isEmpty && !_loading) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && GoRouterState.of(context).matchedLocation == '/checkout') {
          context.pop();
          DgSnackbar.showError(context, message: 'Keranjang belanja kosong.');
        }
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final deliveryFee = _isInstant ? 10000.0 : 5000.0;
    final grandTotal = subtotal + deliveryFee - _promoDiscountAmount;

    final scheduleDisplay = _deliverySlot != null 
        ? '${DateFormat('dd MMM yyyy').format(_scheduledDate)} • ${_deliverySlot!.label}'
        : 'Belum diatur';

    return Stack(
      children: [
        Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
        centerTitle: true,
        title: Text('Checkout', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
      ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Address section
                addressesAsync.when(
                  data: (addresses) {
                    if (addresses.isEmpty) {
                      return _Section(
                        title: 'ALAMAT PENGIRIMAN',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text('Belum ada alamat pengiriman.', style: TextStyle(fontSize: 14)),
                            const SizedBox(height: 12),
                            DgButton(
                              label: 'Tambah Alamat',
                              onPressed: () => context.push('/addresses'),
                              isOutlined: true,
                              size: DgButtonSize.small,
                            ),
                          ],
                        ),
                      );
                    }
                    
                    final primaryAddress = addresses.firstWhere((a) => a.isPrimary, orElse: () => addresses.first);
                    return _Section(
                      title: 'ALAMAT PENGIRIMAN',
                      trailing: GestureDetector(
                        onTap: () => context.push('/addresses'),
                        child: Text('Ganti', style: AppTypography.labelLarge.copyWith(color: AppColors.primary)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(primaryAddress.recipientName.toUpperCase(), style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
                                    const SizedBox(height: 4),
                                    Text(primaryAddress.fullAddress, style: AppTypography.bodySmall.copyWith(color: AppColors.textPrimary)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(height: 1),
                          ),
                          Row(
                            children: [
                              const Icon(Icons.person_outline, size: 18, color: AppColors.primaryDark),
                              const SizedBox(width: 8),
                              Expanded(child: Text('${primaryAddress.recipientName} - ${primaryAddress.phoneWa}', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600, color: AppColors.primaryDark))),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                  loading: () => _Section(
                    title: 'ALAMAT PENGIRIMAN',
                    child: DgShimmer.checkoutAddress(),
                  ),
                  error: (e, _) => const _Section(
                    title: 'ALAMAT PENGIRIMAN',
                    child: Text('Gagal memuat alamat.', style: TextStyle(fontSize: 14)),
                  ),
                ),
                const SizedBox(height: 16),

                // Items
                _Section(
                  title: 'PESANAN',
                  trailing: Text('${cartItems.length} Produk', style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
                  child: Column(
                    children: cartItems.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                width: 80,
                                height: 80,
                                color: AppColors.background,
                                child: item.productImage != null
                                    ? CachedNetworkImage(
                                        imageUrl: defaultTargetPlatform == TargetPlatform.android
                                            ? item.productImage!.replaceAll('localhost', '10.0.2.2')
                                            : item.productImage!,
                                        fit: BoxFit.cover,
                                        errorWidget: (_, __, ___) => const Icon(Icons.image_not_supported, color: AppColors.textHint),
                                      )
                                    : const Icon(Icons.shopping_basket_outlined, color: AppColors.textHint),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (item.variantName != null)
                                    Text(item.variantName!, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                                  Text(item.productName ?? 'Produk', style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
                                  const SizedBox(height: 4),
                                  Text('Rp ${_formatNumber(item.unitPrice ?? 0)}', style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark)),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.grey[300]!),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text('/${item.unit ?? "item"}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text('${item.qty}x', style: AppTypography.labelLarge),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),

                // Schedule
                _Section(
                  title: 'JADWAL PENGIRIMAN',
                  trailing: GestureDetector(
                    onTap: _openScheduleSheet,
                    child: Text(_deliverySlot == null ? 'Atur' : 'Ganti', style: AppTypography.labelLarge.copyWith(color: AppColors.primary)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              scheduleDisplay, 
                              style: AppTypography.labelLarge.copyWith(
                                color: _deliverySlot == null ? AppColors.primary : AppColors.primaryDark
                              )
                            ),
                            if (_deliverySlot == null)
                              Text('Default H+2', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (_deliverySlot == null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: Colors.red.shade600, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Mohon atur jadwal pengiriman sebelum melanjutkan pesanan.',
                              style: AppTypography.bodySmall.copyWith(color: Colors.red.shade700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),

                // Payment
                _Section(
                  title: 'METODE PEMBAYARAN',
                  child: Column(
                    children: [
                      _buildAccordionGroup('E-Wallet', ['GOPAY', 'SHOPEEPAY', 'QRIS']),
                      _buildAccordionGroup('Transfer Bank (Virtual Account)', ['VA_BCA', 'VA_MANDIRI', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'VA_CIMB']),
                      _buildAccordionGroup('Gerai Ritel', ['ALFAMART', 'INDOMARET']),
                      
                      // COD directly selectable
                      Padding(
                        padding: const EdgeInsets.only(top: 8, bottom: 8),
                        child: _SelectableCard(
                          title: _getPaymentMethodName('COD'),
                          iconData: _getPaymentMethodIcon('COD'),
                          imageUrl: _getPaymentMethodImageUrl('COD'),
                          isSelected: _paymentMethod == 'COD',
                          onTap: () {
                            setState(() => _paymentMethod = 'COD');
                          },
                        ),
                      ),
                      const Divider(height: 1),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Promo code
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: AppColors.heroGradient,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryDark.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.local_offer, color: Colors.white),
                          const SizedBox(width: 8),
                          Text(
                            'Punya Kode Promo?',
                            style: AppTypography.labelLarge.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_appliedPromoCode != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(26),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.check_circle, color: AppColors.success),
                                  const SizedBox(width: 8),
                                  Text(
                                    _appliedPromoCode!,
                                    style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                                  ),
                                ],
                              ),
                              GestureDetector(
                                onTap: _removePromo,
                                child: const Text('Hapus', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          height: 52, // Slightly taller to accommodate inner padding
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(26), // Outer pill shape
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _promoCtrl,
                                  style: AppTypography.bodyMedium,
                                  decoration: InputDecoration(
                                    hintText: 'Masukkan kode promo...',
                                    hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.textHint),
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    filled: false, // Ensure theme doesn't paint a square background
                                    contentPadding: const EdgeInsets.only(left: 20, right: 8),
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(4.0),
                                child: SizedBox(
                                  height: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: _isValidatingPromo ? null : _validatePromo,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primaryDark, // Button stands out inside white container
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)), // Inner pill shape
                                      padding: const EdgeInsets.symmetric(horizontal: 24),
                                    ),
                                    child: _isValidatingPromo 
                                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                        : const Text('Pakai', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Order summary
                _Section(
                  title: 'RINGKASAN PEMBAYARAN',
                  child: Column(
                    children: [
                      _SummaryRow('Subtotal (${cartItems.length} item)', 'Rp ${_formatNumber(subtotal)}'),
                      _SummaryRow('Ongkos Kirim', 'Rp ${_formatNumber(deliveryFee)}'),
                      if (_promoDiscountAmount > 0)
                        _SummaryRow('Diskon Promo', '-Rp ${_formatNumber(_promoDiscountAmount)}', valueColor: AppColors.success),
                      const Divider(height: 24),
                      _SummaryRow('Grand Total', 'Rp ${_formatNumber(grandTotal)}', isBold: true),
                    ],
                  ),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
          bottomNavigationBar: Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
            ),
            child: SafeArea(
              child: addressesAsync.when(
                data: (addresses) {
                  final hasAddress = addresses.isNotEmpty;
                  final isSlotSelected = _deliverySlot != null || _isInstant;
                  
                  return Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Grand Total', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            Text('Rp ${_formatNumber(grandTotal)}', style: AppTypography.h3.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: DgButton(
                          label: !hasAddress ? 'Pilih Alamat' : 'Buat Pesanan',
                          isLoading: _loading,
                          onPressed: (hasAddress && isSlotSelected) ? () => _createOrder(addresses.firstWhere((a) => a.isPrimary, orElse: () => addresses.first), cartItems) : null,
                        ),
                      ),
                    ],
                  );
                },
                loading: () => const DgButton(label: 'Memuat...', onPressed: null),
                error: (_, __) => const DgButton(label: 'Alamat Tidak Valid', onPressed: null),
              ),
            ),
          ),
        ),
        
        // Fullscreen Loading Overlay
        if (_loading)
          Container(
            color: Colors.black.withOpacity(0.3),
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
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
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.shadow.withOpacity(0.05), blurRadius: 4)],
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
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

class _SelectableCard extends StatelessWidget {
  const _SelectableCard({
    required this.title,
    required this.iconData,
    this.imageUrl,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final IconData iconData;
  final String? imageUrl;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            if (imageUrl != null)
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Image.asset(
                  imageUrl!,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Icon(iconData, color: isSelected ? AppColors.primary : AppColors.textSecondary),
                ),
              )
            else
              Icon(iconData, color: isSelected ? AppColors.primary : AppColors.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(title, style: AppTypography.labelLarge.copyWith(color: isSelected ? AppColors.primaryDark : AppColors.textPrimary)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow(this.label, this.value, {this.isBold = false, this.valueColor});
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: isBold ? AppTypography.labelLarge : const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          Text(value, style: isBold ? AppTypography.h4.copyWith(color: AppColors.primaryDark) : AppTypography.labelLarge.copyWith(color: valueColor ?? AppColors.textPrimary)),
        ],
      ),
    );
  }
}

// ── WhatsApp Phone Bottom Sheet ─────────────────────────────────

class _PhoneWaSheet extends StatefulWidget {
  const _PhoneWaSheet({required this.authRepo});
  final AuthRepository authRepo;

  @override
  State<_PhoneWaSheet> createState() => _PhoneWaSheetState();
}

class _PhoneWaSheetState extends State<_PhoneWaSheet> {
  final _phoneCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.isEmpty) {
      DgSnackbar.showError(context, message: 'Nomor WhatsApp tidak boleh kosong');
      return;
    }
    final cleaned = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    if (cleaned.length < 10) {
      DgSnackbar.showError(context, message: 'Nomor WhatsApp tidak valid (minimal 10 digit)');
      return;
    }

    setState(() => _saving = true);
    try {
      await widget.authRepo.updateProfile(phoneWa: cleaned);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal menyimpan', error: e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Title
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nomor WhatsApp', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
                const SizedBox(height: 2),
                Text(
                  'Diperlukan untuk konfirmasi pesanan',
                  style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Phone Input
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              autofocus: true,
              style: AppTypography.bodyMedium,
              onSubmitted: (_) => _save(),
              decoration: InputDecoration(
                hintText: 'Contoh: 08123456789',
                hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.textHint),
                prefixIcon: const Padding(
                  padding: EdgeInsets.all(14),
                  child: FaIcon(FontAwesomeIcons.whatsapp, color: Color(0xFF25D366), size: 20),
                ),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Admin akan menghubungi via WhatsApp untuk konfirmasi pesanan Anda.',
              style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),

            // Save Button
            SizedBox(
              width: double.infinity,
              child: DgButton(
                label: 'Simpan & Lanjutkan',
                isLoading: _saving,
                onPressed: _saving ? null : _save,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
