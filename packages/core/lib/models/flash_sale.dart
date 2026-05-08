import 'package:freezed_annotation/freezed_annotation.dart';
import 'product.dart';

part 'flash_sale.freezed.dart';
part 'flash_sale.g.dart';

@freezed
abstract class FlashSaleSession with _$FlashSaleSession {
  const factory FlashSaleSession({
    required String id,
    required String title,
    @Default('') String description,
    required DateTime startAt,
    required DateTime endAt,
    @Default(false) bool isActive,
    @Default([]) List<FlashSaleItem> items,
  }) = _FlashSaleSession;

  factory FlashSaleSession.fromJson(Map<String, dynamic> json) =>
      _$FlashSaleSessionFromJson(json);
}

@freezed
abstract class FlashSaleItem with _$FlashSaleItem {
  const factory FlashSaleItem({
    required String id,
    required String productId,
    required int flashPrice,
    @JsonKey(name: 'flashStock') required int stockQty,
    @Default(0) int soldQty,
    Product? product,
    FlashSaleSession? flashSale,
  }) = _FlashSaleItem;

  factory FlashSaleItem.fromJson(Map<String, dynamic> json) =>
      _$FlashSaleItemFromJson(json);
}
