import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';

void main() {
  runApp(const ProviderScope(child: DapurGiziDriverApp()));
}

class DapurGiziDriverApp extends StatelessWidget {
  const DapurGiziDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dapur Gizi Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const _PlaceholderHome(),
    );
  }
}

/// Temporary placeholder — will be replaced with GoRouter in Batch 4.
class _PlaceholderHome extends StatelessWidget {
  const _PlaceholderHome();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.local_shipping,
              size: 64,
              color: AppColors.primary,
            ),
            const SizedBox(height: 16),
            Text(
              'Dapur Gizi Driver',
              style: AppTypography.h1.copyWith(color: AppColors.primaryDark),
            ),
            const SizedBox(height: 8),
            Text(
              'Driver App — Shell Ready',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
