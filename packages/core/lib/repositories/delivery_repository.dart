import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_providers.dart';
import '../api/api_endpoints.dart';
import '../models/delivery_slot.dart';
import '../auth/auth_repository.dart';

class DeliveryRepository {
  DeliveryRepository(this._api);

  final ApiClient _api;

  Future<List<DeliverySlot>> getSlots({DateTime? date}) async {
    final params = <String, dynamic>{
      if (date != null) 'date': date.toIso8601String(),
    };
    final response = await _api.get(ApiEndpoints.deliverySlots, queryParameters: params);
    
    List list = [];
    if (response.data is Map) {
      list = response.data['data'] as List? ?? response.data['slots'] as List? ?? [];
    } else if (response.data is List) {
      list = response.data as List;
    }
    
    return list.map((e) => DeliverySlot.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final deliveryRepositoryProvider = Provider<DeliveryRepository>((ref) {
  return DeliveryRepository(ref.watch(apiClientProvider));
});
