import 'package:freezed_annotation/freezed_annotation.dart';

part 'region.freezed.dart';
part 'region.g.dart';

@freezed
abstract class Region with _$Region {
  const factory Region({
    required String id,
    required String name,
  }) = _Region;

  factory Region.fromJson(Map<String, dynamic> json) =>
      _$RegionFromJson(json);
}
