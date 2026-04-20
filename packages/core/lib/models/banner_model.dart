import 'package:freezed_annotation/freezed_annotation.dart';
import '../constants/enums.dart';

part 'banner_model.freezed.dart';
part 'banner_model.g.dart';

@freezed
abstract class BannerModel with _$BannerModel {
  const factory BannerModel({
    required String id,
    required BannerType type,
    required String imageUrl,
    String? title,
    @Default(BannerActionType.none) BannerActionType actionType,
    String? actionValue,
    @Default(0) int sortOrder,
    @Default(true) bool isActive,
    DateTime? startAt,
    DateTime? endAt,
  }) = _BannerModel;

  factory BannerModel.fromJson(Map<String, dynamic> json) =>
      _$BannerModelFromJson(json);
}
