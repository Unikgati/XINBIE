import 'package:freezed_annotation/freezed_annotation.dart';

part 'product.freezed.dart';
part 'product.g.dart';

@freezed
abstract class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    @Default('') String description,
    required String categoryId,
    required int price,
    int? discountPrice,
    int? discountPercent,
    required String unit,
    int? weightGram,
    @Default([]) List<String> images,
    @Default(true) bool isUnlimitedStock,
    @Default(0) int stockQty,
    @Default(true) bool isActive,
    @Default(false) bool isFeatured,
    @Default(0) int sortOrder,
    required DateTime createdAt,
    required DateTime updatedAt,
    // Joined fields
    String? categoryName,
    List<ProductVariant>? variants,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}

@freezed
abstract class ProductVariant with _$ProductVariant {
  const factory ProductVariant({
    required String id,
    required String productId,
    required String name,
    @Default(0) int priceAddition,
    @Default(true) bool isActive,
  }) = _ProductVariant;

  factory ProductVariant.fromJson(Map<String, dynamic> json) =>
      _$ProductVariantFromJson(json);
}
