import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

final availablePromosProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(orderRepositoryProvider);
  return await repo.getAvailablePromos();
});
