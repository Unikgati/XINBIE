import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core/core.dart';

/// Authentication state
final authStateProvider = FutureProvider<bool>((ref) async {
  return ref.watch(authRepositoryProvider).isLoggedIn();
});

/// Current user profile
final currentUserProvider = FutureProvider<User?>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  final isLoggedIn = await repo.isLoggedIn();
  if (!isLoggedIn) return null;
  
  try {
    final user = await repo.getMe();
    // Connect WebSocket
    ref.read(socketServiceProvider).connect();
    return user;
  } catch (e) {
    return null;
  }
});


/// User addresses
final addressesProvider = FutureProvider<List<Address>>((ref) async {
  final repo = ref.watch(addressRepositoryProvider);
  return repo.getAddresses();
});

/// Notifications
final notificationsProvider = FutureProvider<List<NotificationModel>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  return repo.getNotifications();
});

/// Unread notification count
final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifs = ref.watch(notificationsProvider);
  return notifs.when(
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
