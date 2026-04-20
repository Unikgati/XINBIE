import 'package:freezed_annotation/freezed_annotation.dart';

part 'cart_item.freezed.dart';
part 'cart_item.g.dart';

@freezed
abstract class CartItem with _$CartItem {
  const factory CartItem({
    required String productId,
    String? variantId,
    required int qty,
    // Denormalized for display (populated from product data)
    String? productName,
    String? productImage,
    int? unitPrice,
    String? unit,
    String? variantName,
    @Default(true) bool isAvailable,
    @Default(false) bool priceChanged,
  }) = _CartItem;

  factory CartItem.fromJson(Map<String, dynamic> json) =>
      _$CartItemFromJson(json);
}
