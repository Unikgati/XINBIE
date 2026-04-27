import 'package:freezed_annotation/freezed_annotation.dart';

part 'address.freezed.dart';
part 'address.g.dart';

@freezed
abstract class Address with _$Address {
  const factory Address({
    required String id,
    required String userId,
    required String recipientName,
    required String phoneWa,
    double? lat,
    double? lng,
    required String fullAddress,
    String? notes,
    String? provinceId,
    String? cityId,
    String? districtId,
    String? villageId,
    @Default(false) bool isPrimary,
    required DateTime createdAt,
  }) = _Address;

  factory Address.fromJson(Map<String, dynamic> json) =>
      _$AddressFromJson(json);
}
