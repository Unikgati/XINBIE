import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/order.dart';
import '../auth/auth_repository.dart';

/// Repository for order-related API calls.
class OrderRepository {
  OrderRepository(this._api);

  final ApiClient _api;

  Future<List<Order>> getOrders({String? status}) async {
    final params = <String, dynamic>{
      if (status != null) 'status': status,
    };
    final response = await _api.get(ApiEndpoints.orders, queryParameters: params);
    List list = [];
    if (response.data is Map) {
      list = response.data['data'] as List? ?? response.data['orders'] as List? ?? [];
    } else if (response.data is List) {
      list = response.data as List;
    }
    return list.map((e) => Order.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Order> getOrder(String id) async {
    final response = await _api.get(ApiEndpoints.order(id));
    return Order.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Order> createOrder({
    required String addressId,
    String? deliverySlotId,
    required List<Map<String, dynamic>> items,
    String? promoCode,
    String? notes,
    required String paymentMethod,
    DateTime? scheduledDate,
    String? deliveryType,
  }) async {
    final response = await _api.post(ApiEndpoints.orders, data: {
      'addressId': addressId,
      if (deliverySlotId != null) 'deliverySlotId': deliverySlotId,
      'items': items,
      if (promoCode != null) 'promoCode': promoCode,
      if (notes != null) 'notes': notes,
      'paymentMethod': paymentMethod,
      if (scheduledDate != null) 'scheduledDate': scheduledDate.toIso8601String(),
      if (deliveryType != null) 'deliveryType': deliveryType,
    });
    return Order.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> cancelOrder(String id, {String? reason}) async {
    await _api.put(ApiEndpoints.orderCancel(id), data: {
      if (reason != null) 'reason': reason,
    });
  }

  Future<Map<String, dynamic>> getPaymentStatus(String orderId) async {
    final response = await _api.get(ApiEndpoints.paymentStatus(orderId));
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> validatePromoCode(String code, double subtotal) async {
    final response = await _api.post(ApiEndpoints.promoValidate, data: {
      'code': code,
      'subtotal': subtotal,
    });
    return response.data as Map<String, dynamic>;
  }
}

final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepository(ref.watch(apiClientProvider));
});
