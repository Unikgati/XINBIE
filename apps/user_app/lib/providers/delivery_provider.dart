import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

final deliverySlotsProvider = FutureProvider.family<List<DeliverySlot>, DateTime?>((ref, date) async {
  final repo = ref.watch(deliveryRepositoryProvider);
  return repo.getSlots(date: date);
});
