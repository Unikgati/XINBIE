import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class BankAccountScreen extends StatefulWidget {
  const BankAccountScreen({super.key});

  @override
  State<BankAccountScreen> createState() => _BankAccountScreenState();
}

class _BankAccountScreenState extends State<BankAccountScreen> {
  String _selectedBank = 'BCA';
  final _accountNumberController = TextEditingController(text: '1234567890');
  final _accountHolderController = TextEditingController(text: 'Budi Santoso');
  final _vehicleTypeController = TextEditingController(text: 'Motor');
  final _vehiclePlateController = TextEditingController(text: 'B 1234 ABC');
  bool _loading = false;
  bool _saved = false;

  static const banks = [
    'BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga', 'Bank Jago',
    'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja',
  ];

  void _save() async {
    if (_accountNumberController.text.isEmpty || _accountHolderController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lengkapi semua data')));
      return;
    }

    setState(() => _loading = true);
    // TODO: Call PUT /driver/bank
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() { _loading = false; _saved = true; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Data rekening berhasil disimpan!'),
        backgroundColor: AppColors.primary,
      ));
      Future.delayed(const Duration(seconds: 2), () { if (mounted) setState(() => _saved = false); });
    }
  }

  @override
  void dispose() {
    _accountNumberController.dispose();
    _accountHolderController.dispose();
    _vehicleTypeController.dispose();
    _vehiclePlateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bank / E-Wallet Section
            _SectionHeader(icon: Icons.account_balance, title: 'Rekening / E-Wallet'),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
              child: Column(children: [
                // Bank dropdown
                _FormField(
                  label: 'Bank / E-Wallet',
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedBank,
                    items: banks.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                    onChanged: (v) => setState(() => _selectedBank = v!),
                    decoration: _inputDecoration,
                  ),
                ),
                const SizedBox(height: 12),

                // Account number
                _FormField(
                  label: 'Nomor Rekening / E-Wallet',
                  child: TextField(
                    controller: _accountNumberController,
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration.copyWith(hintText: 'Masukkan nomor'),
                  ),
                ),
                const SizedBox(height: 12),

                // Account holder
                _FormField(
                  label: 'Nama Pemilik Rekening',
                  child: TextField(
                    controller: _accountHolderController,
                    textCapitalization: TextCapitalization.words,
                    decoration: _inputDecoration.copyWith(hintText: 'Sesuai buku tabungan'),
                  ),
                ),
              ]),
            ),

            const SizedBox(height: 24),

            // Vehicle Section
            _SectionHeader(icon: Icons.two_wheeler, title: 'Info Kendaraan'),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16)),
              child: Column(children: [
                _FormField(
                  label: 'Tipe Kendaraan',
                  child: DropdownButtonFormField<String>(
                    initialValue: _vehicleTypeController.text.isEmpty ? 'Motor' : _vehicleTypeController.text,
                    items: ['Motor', 'Mobil'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                    onChanged: (v) => _vehicleTypeController.text = v!,
                    decoration: _inputDecoration,
                  ),
                ),
                const SizedBox(height: 12),
                _FormField(
                  label: 'Plat Nomor',
                  child: TextField(
                    controller: _vehiclePlateController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: _inputDecoration.copyWith(hintText: 'B 1234 ABC'),
                  ),
                ),
              ]),
            ),

            const SizedBox(height: 16),
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
