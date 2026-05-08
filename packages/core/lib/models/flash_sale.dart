import 'product.dart';

class FlashSaleSession {
  final String id;
  final String title;
  final String description;
  final DateTime startAt;
  final DateTime endAt;
  final bool isActive;
  final List<FlashSaleItem> items;

  FlashSaleSession({
    required this.id,
    required this.title,
    required this.description,
    required this.startAt,
    required this.endAt,
    required this.isActive,
    required this.items,
  });

  factory FlashSaleSession.fromJson(Map<String, dynamic> json) {
    return FlashSaleSession(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] ?? '',
      startAt: DateTime.parse(json['startAt'] as String),
      endAt: DateTime.parse(json['endAt'] as String),
      isActive: json['isActive'] as bool? ?? false,
      items: (json['items'] as List? ?? [])
          .map((e) => FlashSaleItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class FlashSaleItem {
  final String id;
  final String productId;
  final int flashPrice;
  final int flashStock;
  final int soldQty;
  final Product product;

  FlashSaleItem({
    required this.id,
    required this.productId,
    required this.flashPrice,
    required this.flashStock,
    required this.soldQty,
    required this.product,
  });

  factory FlashSaleItem.fromJson(Map<String, dynamic> json) {
    return FlashSaleItem(
      id: json['id'] as String,
      productId: json['productId'] as String,
      flashPrice: json['flashPrice'] as int,
      flashStock: json['flashStock'] as int,
      soldQty: json['soldQty'] as int? ?? 0,
      product: Product.fromJson(json['product'] as Map<String, dynamic>),
    );
  }
}
