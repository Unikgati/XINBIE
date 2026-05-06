import 'package:freezed_annotation/freezed_annotation.dart';
import 'cooking_video.dart';
import 'product_variant.dart';

part 'product.freezed.dart';
part 'product.g.dart';

@freezed
abstract class Product with _$Product {
  const Product._();

  const factory Product({
    required String id,
    required String name,
    @Default('') String description,
    String? categoryId,
    required int price,
    int? discountPrice,
    int? discountPercent,
    required String unit,
    int? weightGram,
    @Default([]) List<String> images,
    @Default([]) List<String> tags,
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
    @Default([]) List<CookingVideo> cookingVideos,
    @Default([]) List<Product> populatedRelatedProducts,
    @Default([]) List<Product> populatedSimilarProducts,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);

  // Helper getters for UI
  bool get hasMultiplePrices {
    if (variants == null || variants!.isEmpty) return false;
    final firstPrice = variants!.first.discountPrice ?? variants!.first.price;
    for (final v in variants!) {
      final p = v.discountPrice ?? v.price;
      if (p != firstPrice) return true;
    }
    return false;
  }

  int get displayPrice {
    if (variants == null || variants!.isEmpty) return price;
    int minSelling = discountPrice ?? price;
    int minBase = price;
    for (final v in variants!) {
      final vSelling = v.discountPrice ?? v.price;
      if (vSelling < minSelling) {
        minSelling = vSelling;
        minBase = v.price;
      }
    }
    return minBase;
  }

  int? get displayDiscountPrice {
    if (variants == null || variants!.isEmpty) return discountPrice;
    int minSelling = discountPrice ?? price;
    int? minDiscount = discountPrice;
    for (final v in variants!) {
      final vSelling = v.discountPrice ?? v.price;
      if (vSelling < minSelling) {
        minSelling = vSelling;
        minDiscount = v.discountPrice;
      }
    }
    return minDiscount;
  }
}

