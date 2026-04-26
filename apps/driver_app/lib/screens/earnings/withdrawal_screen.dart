import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import '../../providers/driver_providers.dart';
import 'package:core/core.dart';

class WithdrawalScreen extends ConsumerStatefulWidget {
  const WithdrawalScreen({super.key});

  @override
  ConsumerState<WithdrawalScreen> createState() => _WithdrawalScreenState();
}

class _WithdrawalScreenState extends ConsumerState<WithdrawalScreen> {
  final _amountController = TextEditingController();
  bool _loading = false;
  final int _minWithdrawal = 50000;

  void _submit(int balance) async {
    final amount = int.tryParse(_amountController.text) ?? 0;
    if (amount < _minWithdrawal) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Minimum penarikan Rp ${_minWithdrawal.toString()}')));
      return;
    }
    if (amount > balance) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saldo tidak cukup')));
      return;
    }

    setState(() => _loading = true);

    try {
      final repo = ref.read(driverRepositoryProvider);
      await repo.requestWithdrawal(amount);
      
      // refresh wallet and earnings after success
      ref.invalidate(driverEarningsProvider(null));
      ref.invalidate(driverWalletProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Permintaan penarikan berhasil diajukan!'),
          backgroundColor: AppColors.primary,
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Gagal: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncEarnings = ref.watch(driverEarningsProvider(null));
    final asyncBank = ref.watch(driverBankInfoProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Tarik Saldo')),
      body: asyncEarnings.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (earningsData) {
          final balance = earningsData['balance'] as int? ?? 0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Balance info
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(16)),
                  child: Column(children: [
                    Text('Saldo Tersedia', style: AppTypography.bodySmall.copyWith(color: AppColors.textOnPrimary.withValues(alpha: 0.8))),
                    const SizedBox(height: 4),
                    Text('Rp ${balance.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}',
                      style: AppTypography.h2.copyWith(color: AppColors.textOnPrimary)),
                  ]),
                ),
                const SizedBox(height: 24),

                // Amount input
                Text('Jumlah Penarikan', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  style: AppTypography.h3,
                  decoration: InputDecoration(
                    prefixText: 'Rp ',
                    hintText: '0',
                    filled: true,
                    fillColor: AppColors.surface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                  ),
                ),
                const SizedBox(height: 8),
                Text('Minimum penarikan: Rp ${_minWithdrawal.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}',
                  style: AppTypography.caption.copyWith(color: AppColors.textHint)),

                // Quick amount buttons
                const SizedBox(height: 12),
                Wrap(spacing: 8, children: [50000, 100000, 150000, balance].where((a) => a <= balance && a >= _minWithdrawal).toSet().map((amount) => 
                  ActionChip(
                    label: Text(amount == balance ? 'Semua' : 'Rp ${(amount / 1000).toStringAsFixed(0)}rb'),
                    onPressed: () => _amountController.text = amount.toString(),
                    backgroundColor: AppColors.primarySurface,
                    labelStyle: AppTypography.labelSmall.copyWith(color: AppColors.primaryDark),
                  ),
                ).toList()),
                const SizedBox(height: 24),

                // Bank info
                Text('Transfer ke', style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                asyncBank.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('Gagal memuat bank: $e')),
                  data: (bank) => Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                    child: Row(children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.account_balance, color: AppColors.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(bank.bankName ?? 'Belum ada bank', style: AppTypography.labelLarge),
                        Text(bank.accountNumber ?? '-', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                        Text('a/n ${bank.accountHolder ?? '-'}', style: AppTypography.caption.copyWith(color: AppColors.textHint)),
                      ])),
                      const Icon(Icons.chevron_right, color: AppColors.textHint, size: 20),
                    ]),
                  ),
                ),
                
                const SizedBox(height: 8),
                Text('Penarikan diproses dalam 1x24 jam oleh admin.', style: AppTypography.caption.copyWith(color: AppColors.textHint)),

                const SizedBox(height: 32),

                // Submit
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : () => _submit(balance),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
                    ),
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Ajukan Penarikan', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
