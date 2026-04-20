import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';

class AddressListScreen extends StatelessWidget {
  const AddressListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Alamat Saya')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _AddressCard(
            name: 'Budi Santoso',
            phone: '0812-xxxx-xxxx',
            address: 'Jl. Sudirman No. 15, Jakarta Pusat',
            isPrimary: true,
          ),
          const SizedBox(height: 12),
          _AddressCard(
            name: 'Budi (Kantor)',
            phone: '0812-xxxx-xxxx',
            address: 'Jl. Gatot Subroto Kav. 42, Jakarta Selatan',
            isPrimary: false,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Add address form
        },
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: AppColors.textOnPrimary),
        label: Text('Tambah Alamat', style: AppTypography.labelLarge.copyWith(color: AppColors.textOnPrimary)),
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.name, required this.phone, required this.address, required this.isPrimary});
  final String name, phone, address;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        border: isPrimary ? Border.all(color: AppColors.primary, width: 1.5) : null,
        boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(name, style: AppTypography.labelLarge)),
              if (isPrimary) DgBadge(label: 'Utama', color: AppColors.primary),
            ],
          ),
          const SizedBox(height: 4),
          Text(phone, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 4),
          Text(address, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 12),
          Row(
            children: [
              TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Edit'),
              ),
              TextButton.icon(
                onPressed: () {},
                icon: Icon(Icons.delete_outline, size: 16, color: AppColors.error),
                label: Text('Hapus', style: TextStyle(color: AppColors.error)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
