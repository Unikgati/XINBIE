import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/user_providers.dart';
import '../../providers/auth_provider.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:core/core.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/cart_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final userState = ref.watch(currentUserProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Profil',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: userState.when(
        data: (user) {
          if (user == null) {
            return Center(
              child: DgEmptyState(
                icon: Icons.lock_outline,
                title: 'Belum Masuk',
                subtitle: 'Yuk masuk atau daftar akun dulu biar bisa atur profil dan alamat kamu!',
                actionLabel: 'Masuk Sekarang',
                onAction: () => context.push('/login'),
              ),
            );
          }
          final nameParts = user.name.split(' ');
          String initials = '';
          if (nameParts.isNotEmpty && nameParts[0].isNotEmpty) initials += nameParts[0][0];
          if (nameParts.length > 1 && nameParts[1].isNotEmpty) initials += nameParts[1][0];
          if (initials.isEmpty) initials = 'U';

          final bottomPadding = MediaQuery.of(context).padding.bottom + 90;

          return SafeArea(
            bottom: false,
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, 24, 16, bottomPadding),
              child: Column(
                children: [
                  // Profile header
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: AppColors.primarySurface,
                          backgroundImage: user.avatarUrl != null 
                              ? CachedNetworkImageProvider(AppConfig.fixImageUrl(user.avatarUrl!)) as ImageProvider
                              : null,
                          child: user.avatarUrl == null 
                              ? Text(initials.toUpperCase(), style: AppTypography.h2.copyWith(color: AppColors.primary))
                              : null,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          user.name, 
                          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Menu Group 1
                  _MenuGroup(
                    children: [
                      _MenuItem(
                        icon: Icons.person_outline, 
                        label: 'Edit Profil', 
                        onTap: () => context.push('/edit-profile')
                      ),
                      _MenuItem(
                        icon: Icons.location_on_outlined, 
                        label: 'Alamat Saya', 
                        onTap: () => context.push('/addresses')
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Menu Group 2
                  _MenuGroup(
                    children: [
                      _MenuItem(
                        icon: Icons.help_outline, 
                        label: 'Pusat Bantuan', 
                        onTap: () {}
                      ),
                      _MenuItem(
                        icon: Icons.description_outlined, 
                        label: 'Syarat & Ketentuan', 
                        onTap: () {}
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Logout Button Group
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEAEA), // Light red from mockup
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            useRootNavigator: true,
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                            ),
                            builder: (sheetContext) => SafeArea(
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
                                    Text('Keluar dari Akun', style: AppTypography.h3),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Yakin ingin keluar dari akun Anda?',
                                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                                    ),
                                    const SizedBox(height: 32),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: () => Navigator.pop(sheetContext),
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
                                            onPressed: () async {
                                              Navigator.pop(sheetContext); 
                                              // Logout via notifier and invalidate ALL user-scoped states
                                              await ref.read(authNotifierProvider.notifier).logout();
                                              ref.invalidate(authStateProvider);
                                              ref.invalidate(currentUserProvider);
                                              ref.invalidate(addressesProvider);
                                              ref.invalidate(notificationsProvider);
                                              ref.read(cartProvider.notifier).clear();
                                              if (context.mounted) {
                                                context.go('/home'); 
                                              }
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppColors.error,
                                              padding: const EdgeInsets.symmetric(vertical: 16),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              elevation: 0,
                                            ),
                                            child: Text('Keluar', style: AppTypography.labelLarge.copyWith(color: Colors.white)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          child: Row(
                            children: [
                              const Icon(Icons.logout, color: AppColors.error, size: 22),
                              const SizedBox(width: 16),
                              Text(
                                'Keluar', 
                                style: AppTypography.bodyMedium.copyWith(
                                  color: AppColors.error, 
                                  fontWeight: FontWeight.w500
                                )
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
        loading: () => DgShimmer.profile(),
        error: (err, _) => Center(child: Text('Terjadi kesalahan: $err')),
      ),
    );
  }
}

class _MenuGroup extends StatelessWidget {
  const _MenuGroup({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: children.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isLast = index == children.length - 1;
          
          if (isLast) return item;
          return Column(
            children: [
              item,
              Divider(height: 1, color: Colors.grey.withValues(alpha: 0.1), indent: 16, endIndent: 16),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Icon(icon, color: AppColors.textSecondary, size: 22),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  label, 
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textPrimary, 
                    fontWeight: FontWeight.w500,
                  )
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.primaryAction, size: 24),
            ],
          ),
        ),
      ),
    );
  }
}
