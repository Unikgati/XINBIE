import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:intl/intl.dart';
import '../../../widgets/dg_promo_voucher_card.dart';

class VoucherListBottomSheet extends ConsumerStatefulWidget {
  final double subtotal;
  const VoucherListBottomSheet({super.key, required this.subtotal});

  @override
  ConsumerState<VoucherListBottomSheet> createState() => _VoucherListBottomSheetState();
}

class _VoucherListBottomSheetState extends ConsumerState<VoucherListBottomSheet> {
  bool _loading = false;
  List<Map<String, dynamic>> _vouchers = [];

  @override
  void initState() {
    super.initState();
    _fetchVouchers();
  }

  Future<void> _fetchVouchers() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(orderRepositoryProvider);
      final res = await repo.getAvailablePromos();
      setState(() => _vouchers = res);
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal memuat voucher');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Pilih Voucher', style: AppTypography.h3.copyWith(color: AppColors.primaryDark)),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading)
            DgShimmer.voucherList()
          else if (_vouchers.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Icons.sell_outlined, size: 64, color: AppColors.textHint.withOpacity(0.5)),
                    const SizedBox(height: 16),
                    Text('Belum ada voucher tersedia', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                  ],
                ),
              ),
            )
          else
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _vouchers.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final v = _vouchers[index];
                  final isEligible = widget.subtotal >= (v['minOrder'] as num);
                  
                  return DgPromoVoucherCard(
                    promo: {
                      ...v,
                      'currentSubtotal': widget.subtotal,
                    },
                    width: double.infinity,
                    isEligible: isEligible,
                    onTap: () => Navigator.pop(context, v['code']),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
