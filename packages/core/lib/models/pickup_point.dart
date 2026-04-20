import 'package:freezed_annotation/freezed_annotation.dart';

part 'pickup_point.freezed.dart';
part 'pickup_point.g.dart';

@freezed
abstract class PickupPoint with _$PickupPoint {
  const factory PickupPoint({
    required String id,
    required String name,
    required double lat,
    required double lng,
    required String fullAddress,
    String? phoneWa,
    String? operationalHours,
    String? notesForDriver,
    @Default(true) bool isActive,
    required DateTime createdAt,
  }) = _PickupPoint;

  factory PickupPoint.fromJson(Map<String, dynamic> json) =>
      _$PickupPointFromJson(json);
}
