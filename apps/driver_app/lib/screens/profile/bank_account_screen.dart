import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/driver_providers.dart';

class BankAccountScreen extends ConsumerStatefulWidget {
  const BankAccountScreen({super.key});
  @override
  ConsumerState<BankAccountScreen> createState() => _BankAccountScreenState();
}

class _BankAccountScreenState extends ConsumerState<BankAccountScreen> {
  String _selectedBank = 'BCA';
  final _accountNumberCtrl = TextEditingController();
  final _accountHolderCtrl = TextEditingController();
  String _vehicleType = 'Motor';
  final _vehiclePlateCtrl = TextEditingController();
  bool _loading = false;
  bool _saved = false;
  bool _dataLoaded = false;

  static const banks = [
    'BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga', 'Bank Jago',
    'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja',
  ];

  @override
  void dispose() {
    _accountNumberCtrl.dispose();
    _accountHolderCtrl.dispose();
    _vehiclePlateCtrl.dispose();
    super.dispose();
  }

  void _populateFromData(BankInfo bank) {
    if (_dataLoaded) return;
    _dataLoaded = true;
    _selectedBank = bank.bankName ?? 'BCA';
    _accountNumberCtrl.text = bank.accountNumber ?? '';
    _accountHolderCtrl.text = bank.accountHolder ?? '';
    _vehicleType = bank.vehicleType ?? 'Motor';
    _vehiclePlateCtrl.text = bank.vehiclePlate ?? '';
  }

  Future<void> _save() async {
    if (_accountNumberCtrl.text.isEmpty || _accountHolderCtrl.text.isEmpty) {
      DgSnackbar.showError(context, message: 'Lengkapi semua data');
      return;
    }

    setState(() => _loading = true);
    try {
      await ref.read(driverRepositoryProvider).updateBankInfo({
        'bankName': _selectedBank,
        'accountNumber': _accountNumberCtrl.text.trim(),
        'accountHolder': _accountHolderCtrl.text.trim(),
        'vehicleType': _vehicleType,
        'vehiclePlate': _vehiclePlateCtrl.text.trim(),
      });
      ref.invalidate(driverBankInfoProvider);
      if (mounted) {
        setState(() { _saved = true; });
        DgSnackbar.showSuccess(context, message: 'Data berhasil disimpan!');
        Future.delayed(const Duration(seconds: 2), () { if (mounted) setState(() => _saved = false); });
      }
    } catch (e) {
      if (mounted) DgSnackbar.showError(context, message: 'Gagal menyimpan', error: e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncBank = ref.watch(driverBankInfoProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Rekening & Kendaraan'),
        actions: [
          TextButton.icon(
            onPressed: _loading ? null : _save,
            icon: _loading
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : Icon(_saved ? Icons.check_circle : Icons.save, size: 18),
            label: Text(_saved ? 'Tersimpan' : 'Simpan'),
          ),
        ],
      ),
      body: asyncBank.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Gagal memuat: $e')),
        data: (bank) {
          _populateFromData(bank);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Bank section
                _SectionHeader(icon: Icons.account_balance, title: 'Rekening / E-Wallet'),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
                  child: Column(children: [
                    _FormField(
                      label: 'Bank / E-Wallet',
                      child: DgDropdownField<String>(
                        items: banks,
                        value: banks.contains(_selectedBank) ? _selectedBank : banks.first,
                        hintText: 'Pilih bank',
                        prefixIcon: Icons.account_balance,
                        onChanged: (v) => setState(() => _selectedBank = v!),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _FormField(
                      label: 'Nomor Rekening / E-Wallet',
                      child: TextField(
                        controller: _accountNumberCtrl,
                        keyboardType: TextInputType.number,
                        decoration: _inputDecoration.copyWith(hintText: 'Masukkan nomor'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _FormField(
                      label: 'Nama Pemilik Rekening',
                      child: TextField(
                        controller: _accountHolderCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: _inputDecoration.copyWith(hintText: 'Sesuai buku tabungan'),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 24),

                // Vehicle section
                _SectionHeader(icon: Icons.two_wheeler, title: 'Info Kendaraan'),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
                  child: Column(children: [
                    _FormField(
                      label: 'Tipe Kendaraan',
                      child: DgDropdownField<String>(
                        items: const ['Motor', 'Mobil'],
                        value: _vehicleType,
                        hintText: 'Pilih tipe',
                        iconBuilder: (v) => v == 'Mobil' ? Icons.directions_car_outlined : Icons.two_wheeler,
                        onChanged: (v) => setState(() => _vehicleType = v!),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _FormField(
                      label: 'Plat Nomor',
                      child: TextField(
                        controller: _vehiclePlateCtrl,
                        textCapitalization: TextCapitalization.characters,
                        decoration: _inputDecoration.copyWith(hintText: 'B 1234 ABC', prefixIcon: const Icon(Icons.badge_outlined)),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 16),

                // Info note
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.primarySurface, borderRadius: BorderRadius.circular(10)),
                  child: Row(children: [
                    const Icon(Icons.info_outline, color: AppColors.primary, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(
                      'Pastikan data rekening sesuai agar pencairan saldo tidak terhambat.',
                      style: AppTypography.caption.copyWith(color: AppColors.primaryDark),
                    )),
                  ]),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  InputDecoration get _inputDecoration => InputDecoration(
    filled: true,
    fillColor: AppColors.background,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.border)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.border)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
  );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.title});
  final IconData icon;
  final String title;
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, color: AppColors.primary, size: 20),
    const SizedBox(width: 8),
    Text(title, style: AppTypography.h4),
  ]);
}

class _FormField extends StatelessWidget {
  const _FormField({required this.label, required this.child});
  final String label;
  final Widget child;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary)),
      const SizedBox(height: 6),
      child,
    ],
  );
}
