import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../providers/user_providers.dart';

class AddressListScreen extends ConsumerWidget {
  const AddressListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Alamat',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
        iconTheme: const IconThemeData(color: AppColors.textSecondary),
      ),
      body: addressesAsync.when(
        data: (addresses) {
          if (addresses.isEmpty) {
            return const Center(
              child: DgEmptyState(
                icon: Icons.location_off_outlined,
                title: 'Belum Ada Alamat',
                subtitle: 'Anda belum menyimpan alamat pengiriman. Tambahkan sekarang untuk mempermudah pesanan!',
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: addresses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final addr = addresses[index];
              return _AddressCard(
                address: addr,
                onEdit: () {
                  context.push('/address-form', extra: addr);
                },
                onDelete: () async {
                  final confirm = await showModalBottomSheet<bool>(
                    context: context,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    builder: (context) => SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 48,
                              height: 4,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade300,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text('Hapus Alamat?', style: AppTypography.h3),
                            const SizedBox(height: 8),
                            Text(
                              'Apakah Anda yakin ingin menghapus alamat ini?',
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 32),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () => Navigator.pop(context, false),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      side: BorderSide(color: Colors.grey.shade300),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    child: Text('Batal', style: AppTypography.labelLarge.copyWith(color: AppColors.textPrimary)),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () => Navigator.pop(context, true),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.error,
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      elevation: 0,
                                    ),
                                    child: Text('Hapus', style: AppTypography.labelLarge.copyWith(color: Colors.white)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );

                  if (confirm == true) {
                    try {
                      await ref.read(addressRepositoryProvider).deleteAddress(addr.id);
                      ref.invalidate(addressesProvider);
                      if (context.mounted) {
                        DgSnackbar.showSuccess(context, message: 'Alamat berhasil dihapus');
                      }
                    } catch (e) {
                      if (context.mounted) {
                        DgSnackbar.showError(context, message: 'Gagal menghapus alamat', error: e);
                      }
                    }
                  }
                },
              );
            },
          );
        },
        loading: () => DgShimmer.addressList(),
        error: (err, _) => Center(
          child: DgEmptyState(
            icon: Icons.error_outline,
            title: 'Gagal Memuat Alamat',
            subtitle: err.toString(),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: DgButton(
            label: 'Tambah Alamat',
            onPressed: () {
              context.push('/address-form');
            },
          ),
        ),
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.address, required this.onEdit, required this.onDelete});
  final Address address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: address.isPrimary ? AppColors.primary : Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  children: [
                    Text(
                      'Alamat', 
                      style: AppTypography.h4.copyWith(
                        color: AppColors.textPrimary, 
                        fontWeight: FontWeight.bold
                      )
                    ),
                    if (address.isPrimary) const DgBadge(label: 'Utama', color: AppColors.primary),
                  ],
                ),
              ),
              InkWell(
                onTap: onEdit,
                child: const Icon(Icons.edit_outlined, color: AppColors.textSecondary, size: 20),
              ),
              const SizedBox(width: 16),
              InkWell(
                onTap: onDelete,
                child: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            address.fullAddress, 
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary, 
              height: 1.4
            )
          ),
          const SizedBox(height: 12),
          Divider(color: Colors.grey.withValues(alpha: 0.1), height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.person_outline, color: AppColors.textSecondary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${address.recipientName} - ${address.phoneWa}',
                  style: AppTypography.labelLarge.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
