import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:intl/intl.dart';

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
    final fmt = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);

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
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
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
                  final minOrder = (v['minOrder'] as num).toDouble();
                  final isEligible = widget.subtotal >= minOrder;
                  final type = v['type'] as String;
                  final value = v['value'] as num;
                  
                  return GestureDetector(
                    onTap: isEligible ? () => Navigator.pop(context, v['code']) : null,
                    child: Opacity(
                      opacity: isEligible ? 1.0 : 0.6,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isEligible ? AppColors.primary.withOpacity(0.3) : AppColors.divider),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.confirmation_num_outlined, color: AppColors.primary),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    v['code'],
                                    style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold, letterSpacing: 1),
                                  ),
                                  Text(
                                    'Diskon ${type == 'PERCENT' ? '$value%' : fmt.format(value)}',
                                    style: AppTypography.h4.copyWith(color: AppColors.primaryDark),
                                  ),
                                  Text(
                                    'Min. belanja ${fmt.format(minOrder)}',
                                    style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                                  ),
                                  if ((v['categories'] as List? ?? []).isNotEmpty || (v['products'] as List? ?? []).isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.inventory_2_outlined, size: 14, color: Colors.blue),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              (v['categories'] as List).isNotEmpty 
                                                ? 'Kategori: ${(v['categories'] as List).map((c) => c['name']).join(', ')}' 
                                                : 'Produk Khusus',
                                              style: const TextStyle(fontSize: 10, color: Colors.blue, fontWeight: FontWeight.bold),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  if ((v['allowedPaymentMethods'] as List? ?? []).isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.payments_outlined, size: 14, color: Colors.orange),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${(v['allowedPaymentMethods'] as List).join(', ')} ONLY',
                                            style: const TextStyle(fontSize: 10, color: Colors.orange, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    )
                                  else if (v['allowCod'] == false)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.payments_outlined, size: 14, color: Colors.orange),
                                          const SizedBox(width: 4),
                                          const Text(
                                            'NON-COD ONLY',
                                            style: TextStyle(fontSize: 10, color: Colors.orange, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ),
                                  if (!isEligible)
                                    Padding(
                                      padding: const EdgeInsets.top(4),
                                      child: Text(
                                        'Kurang ${fmt.format(minOrder - widget.subtotal)} lagi',
                                        style: const TextStyle(color: AppColors.error, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            if (isEligible)
                              const Icon(Icons.chevron_right, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
