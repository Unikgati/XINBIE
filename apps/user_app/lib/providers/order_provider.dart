import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Active orders (ongoing)
final activeOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(status: 'active');
});

/// Order history (completed/cancelled)
final orderHistoryProvider = FutureProvider<List<Order>>((ref) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(status: 'completed');
});

/// Single order detail
final orderDetailProvider = FutureProvider.family<Order, String>((ref, id) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrder(id);
});
