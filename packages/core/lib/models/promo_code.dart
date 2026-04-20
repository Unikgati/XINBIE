import 'package:freezed_annotation/freezed_annotation.dart';
import '../constants/enums.dart';

part 'promo_code.freezed.dart';
part 'promo_code.g.dart';

@freezed
abstract class PromoCode with _$PromoCode {
  const factory PromoCode({
    required String id,
    required String code,
    required PromoType type,
    required int value,
    @Default(0) int minOrder,
    int? maxDiscount,
    @Default(0) int totalUsageLimit,
    @Default(0) int perUserLimit,
    @Default(0) int usedCount,
    @Default(true) bool isActive,
    DateTime? startAt,
    DateTime? endAt,
  }) = _PromoCode;

  factory PromoCode.fromJson(Map<String, dynamic> json) =>
      _$PromoCodeFromJson(json);
}
