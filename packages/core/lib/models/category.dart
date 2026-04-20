import 'package:freezed_annotation/freezed_annotation.dart';

part 'category.freezed.dart';
part 'category.g.dart';

@freezed
abstract class Category with _$Category {
  const factory Category({
    required String id,
    required String name,
    String? iconUrl,
    @Default('#4CAF50') String bgColor,
    @Default(0) int sortOrder,
    @Default(true) bool isActive,
    @Default(0) int productCount,
  }) = _Category;

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
}
