import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/cart_provider.dart';
import '../../providers/user_providers.dart';
import 'widgets/schedule_bottom_sheet.dart';
import 'widgets/checkout_address_section.dart';
import 'widgets/checkout_items_section.dart';
import 'widgets/checkout_schedule_section.dart';
import 'widgets/checkout_payment_section.dart';
import 'widgets/checkout_promo_section.dart';
import 'widgets/checkout_summary_section.dart';
import 'package:intl/intl.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String? _paymentMethod;
  final _promoCtrl = TextEditingController();
  bool _loading = false;
  
  late DateTime _scheduledDate;
  DeliverySlot? _deliverySlot;

  String? _appliedPromoCode;
  int _promoDiscountAmount = 0;
  bool _isValidatingPromo = false;

  @override
  void initState() {
    super.initState();
    _scheduledDate = DateTime.now().add(const Duration(days: 2));
  }

  @override
  void dispose() {
    _promoCtrl.dispose();
    super.dispose();
  }

  bool get _isInstant => _deliverySlot?.id == 'INSTANT';

  Future<void> _validatePromo() async {
    final code = _promoCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() => _isValidatingPromo = true);
    try {
      final subtotal = ref.read(cartSubtotalProvider);
      final repo = ref.read(orderRepositoryProvider);
      final res = await repo.validatePromoCode(code, subtotal.toDouble());
      
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
    if (_paymentMethod == null) {
      DgSnackbar.showError(context, message: 'Mohon pilih metode pembayaran');
      return;
    }

    final user = await ref.read(currentUserProvider.future);
    if (user?.phoneWa == null || (user?.phoneWa?.isEmpty ?? true)) {
      final phoneEntered = await _showPhoneWaBottomSheet();
      if (!phoneEntered) return;
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
        paymentMethod: _paymentMethod!,
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
      if (mounted) DgSnackbar.showError(context, message: 'Gagal membuat pesanan', error: e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<bool> _showPhoneWaBottomSheet() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PhoneWaSheet(authRepo: ref.read(authRepositoryProvider)),
    );
    if (result == true) ref.invalidate(currentUserProvider);
    return result == true;
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

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartProvider);
    final addressesAsync = ref.watch(addressesProvider);
    final subtotal = ref.watch(cartSubtotalProvider).toDouble();

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
              children: [
                const CheckoutAddressSection(),
                const SizedBox(height: 16),
                const CheckoutItemsSection(),
                const SizedBox(height: 16),
                CheckoutScheduleSection(
                  scheduledDate: _scheduledDate,
                  deliverySlot: _deliverySlot,
                  onTap: _openScheduleSheet,
                ),
                const SizedBox(height: 16),
                CheckoutPaymentSection(
                  selectedMethod: _paymentMethod,
                  onSelected: (val) => setState(() => _paymentMethod = val),
                ),
                const SizedBox(height: 16),
                CheckoutPromoSection(
                  controller: _promoCtrl,
                  appliedCode: _appliedPromoCode,
                  isValidating: _isValidatingPromo,
                  onApply: _validatePromo,
                  onRemove: _removePromo,
                ),
                const SizedBox(height: 16),
                CheckoutSummarySection(
                  subtotal: subtotal,
                  deliveryFee: deliveryFee,
                  promoDiscount: _promoDiscountAmount,
                  totalItems: cartItems.length,
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
                  final isSlotSelected = _deliverySlot != null;
                  final isPaymentSelected = _paymentMethod != null;
                  
                  return Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Grand Total', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            Text(
                              'Rp ${NumberFormat.currency(locale: "id", symbol: "", decimalDigits: 0).format(grandTotal)}', 
                              style: AppTypography.h3.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold)
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: DgButton(
                          label: !hasAddress ? 'Pilih Alamat' : 'Buat Pesanan',
                          isLoading: _loading,
                          onPressed: (hasAddress && isSlotSelected && isPaymentSelected) 
                              ? () => _createOrder(addresses.firstWhere((a) => a.isPrimary, orElse: () => addresses.first), cartItems) 
                              : null,
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
        if (_loading)
          Container(
            color: Colors.black.withOpacity(0.3),
            child: const Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }
}

class _PhoneWaSheet extends StatefulWidget {
  final AuthRepository authRepo;
  const _PhoneWaSheet({required this.authRepo});
  @override
  State<_PhoneWaSheet> createState() => _PhoneWaSheetState();
}

class _PhoneWaSheetState extends State<_PhoneWaSheet> {
  final _ctrl = TextEditingController();
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('WhatsApp Aktif', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Mohon masukkan nomor WhatsApp untuk koordinasi pengiriman.', textAlign: TextAlign.center),
          const SizedBox(height: 20),
          TextField(
            controller: _ctrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Nomor WhatsApp', hintText: '08123...'),
          ),
          const SizedBox(height: 20),
          DgButton(
            label: 'Simpan & Lanjutkan',
            isLoading: _loading,
            onPressed: () async {
              if (_ctrl.text.isEmpty) return;
              setState(() => _loading = true);
              try {
                await widget.authRepo.updateProfile(phoneWa: _ctrl.text);
                if (mounted) Navigator.pop(context, true);
              } catch (e) {
                if (mounted) DgSnackbar.showError(context, message: 'Gagal menyimpan nomor');
              } finally {
                if (mounted) setState(() => _loading = false);
              }
            },
          ),
        ],
      ),
    );
  }
}
