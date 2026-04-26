import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/notification_model.dart';
import '../auth/auth_repository.dart';

/// Repository for notification operations.
class NotificationRepository {
  NotificationRepository(this._api);

  final ApiClient _api;

  Future<List<NotificationModel>> getNotifications() async {
    final response = await _api.get(ApiEndpoints.notifications);
    List list = [];
    if (response.data is Map) {
      list = response.data['data'] as List? ?? response.data['notifications'] as List? ?? [];
    } else if (response.data is List) {
      list = response.data as List;
    }
    return list.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markAsRead(String id) async {
    await _api.put(ApiEndpoints.notificationRead(id));
  }

  Future<void> markAllAsRead() async {
    await _api.put(ApiEndpoints.notificationsReadAll);
  }
}

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(apiClientProvider));
});
