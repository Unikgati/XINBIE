import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';
import 'user_providers.dart';

final availablePromosProvider = FutureProvider<List<PromoCode>>((ref) async {
  // Watch auth state so this provider refreshes when user logs in/out
  ref.watch(authStateProvider);
  
  final repo = ref.watch(orderRepositoryProvider);
  return await repo.getAvailablePromos();
});
