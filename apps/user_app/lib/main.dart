import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ui_kit/ui_kit.dart';

void main() {
  runApp(const ProviderScope(child: DapurGiziApp()));
}

class DapurGiziApp extends StatelessWidget {
  const DapurGiziApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dapur Gizi',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const _PlaceholderHome(),
    );
  }
}

/// Temporary placeholder — will be replaced with GoRouter in Batch 3.
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
              Icons.restaurant,
              size: 64,
              color: AppColors.primary,
            ),
            const SizedBox(height: 16),
            Text(
              'Dapur Gizi',
              style: AppTypography.h1.copyWith(color: AppColors.primaryDark),
            ),
            const SizedBox(height: 8),
            Text(
              'User App — Shell Ready',
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
