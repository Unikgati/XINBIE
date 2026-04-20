import 'package:freezed_annotation/freezed_annotation.dart';

part 'delivery_slot.freezed.dart';
part 'delivery_slot.g.dart';

@freezed
abstract class DeliverySlot with _$DeliverySlot {
  const factory DeliverySlot({
    required String id,
    required int dayOfWeek,
    required String label,
    required String startTime,
    required String endTime,
    @Default(50) int maxOrders,
    @Default(3) int cutoffHours,
    @Default(true) bool isActive,
    // Computed
    @Default(0) int currentOrders,
  }) = _DeliverySlot;

  factory DeliverySlot.fromJson(Map<String, dynamic> json) =>
      _$DeliverySlotFromJson(json);
}
