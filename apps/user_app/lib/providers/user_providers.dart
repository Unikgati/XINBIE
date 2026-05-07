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

/// Notifications State Notifier
class NotificationNotifier extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  NotificationNotifier(this._repo, this._socket) : super(const AsyncValue.loading()) {
    _init();
  }

  final NotificationRepository _repo;
  final SocketService _socket;

  Future<void> _init() async {
    await fetch();
    _socket.onNotificationNew((data) {
      final newNotif = NotificationModel.fromJson(data);
      state.whenData((list) {
        state = AsyncValue.data([newNotif, ...list]);
      });
    });
  }

  Future<void> fetch() async {
    state = const AsyncValue.loading();
    try {
      final notifs = await _repo.getNotifications();
      state = AsyncValue.data(notifs);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _repo.markAsRead(id);
      state.whenData((list) {
        state = AsyncValue.data(
          list.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
        );
      });
    } catch (e) {
      // ignore
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _repo.markAllAsRead();
      state.whenData((list) {
        state = AsyncValue.data(
          list.map((n) => n.copyWith(isRead: true)).toList(),
        );
      });
    } catch (e) {
      // ignore
    }
  }
}

final notificationsProvider = StateNotifierProvider<NotificationNotifier, AsyncValue<List<NotificationModel>>>((ref) {
  return NotificationNotifier(
    ref.watch(notificationRepositoryProvider),
    ref.watch(socketServiceProvider),
  );
});

/// Unread notification count
final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifsAsync = ref.watch(notificationsProvider);
  return notifsAsync.when(
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
