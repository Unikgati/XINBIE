import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import '../../../providers/user_providers.dart';

class CheckoutAddressSection extends ConsumerWidget {
  const CheckoutAddressSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressesProvider);

    return addressesAsync.when(
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
                        Text(
                          primaryAddress.recipientName.toUpperCase(),
                          style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          primaryAddress.fullAddress,
                          style: AppTypography.bodySmall.copyWith(color: AppColors.textPrimary),
                        ),
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
                  Expanded(
                    child: Text(
                      '${primaryAddress.recipientName} - ${primaryAddress.phoneWa}',
                      style: AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
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
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
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
