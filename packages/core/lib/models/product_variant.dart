import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_variant.freezed.dart';
part 'product_variant.g.dart';

@freezed
abstract class ProductVariant with _$ProductVariant {
  const factory ProductVariant({
    required String id,
    required String productId,
    required String name,
    String? sku,
    @Default(0) int price,
    @Default(0) int costPrice,
    int? discountPrice,
    @Default(0) int priceAddition,
    @Default(0) int stockQty,
    String? imageUrl,
    @Default(0) int sortOrder,
    @Default(true) bool isActive,
  }) = _ProductVariant;

  factory ProductVariant.fromJson(Map<String, dynamic> json) =>
      _$ProductVariantFromJson(json);
}
