import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../auth/auth_repository.dart';
import '../constants/app_config.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService(ref);
});

class SocketService {
  final Ref _ref;
  IO.Socket? _socket;
  
  // Track listeners to avoid duplicates
  final Map<String, void Function(dynamic)> _listeners = {};

  SocketService(this._ref);

  /// Automatically connects to the backend Socket.io server using the current JWT token.
  Future<void> connect() async {
    if (_socket?.connected == true) return;

    final token = await _ref.read(authRepositoryProvider).getToken();
    if (token == null) return;

    // e.g., 'http://10.0.2.2:3001'
    final baseUrl = AppConfig.apiBaseUrl.replaceAll('/api', '');

    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .build(),
    );

    _socket?.connect();

    _socket?.onConnect((_) {
      print('🟢 Socket connected');
    });

    _socket?.onConnectError((err) {
      print('🔴 Socket connect error: $err');
    });

    _socket?.onDisconnect((_) {
      print('⚪ Socket disconnected');
    });
  }

  void disconnect() {
    if (_socket != null) {
      _socket?.disconnect();
      _socket?.dispose();
      _socket = null;
      _listeners.clear();
      print('⚪ Socket disconnected manually');
    }
  }

  /// Listen for real-time payment updates.
  void onPaymentUpdate(Function(Map<String, dynamic>) callback) {
    if (_socket == null) return;
    
    // Prevent duplicate listeners
    offPaymentUpdate();

    void wrappedCallback(dynamic data) {
      if (data is Map) {
        callback(Map<String, dynamic>.from(data));
      }
    }

    _listeners['payment:update'] = wrappedCallback;
    _socket?.on('payment:update', wrappedCallback);
  }

  void offPaymentUpdate() {
    final callback = _listeners.remove('payment:update');
    if (callback != null && _socket != null) {
      _socket?.off('payment:update', callback);
    }
  }

  /// Listen for real-time incoming orders.
  void onOrderNew(Function(Map<String, dynamic>) callback) {
    if (_socket == null) return;
    
    offOrderNew();

    void wrappedCallback(dynamic data) {
      if (data is Map) {
        callback(Map<String, dynamic>.from(data));
      }
    }

    _listeners['order:new'] = wrappedCallback;
    _socket?.on('order:new', wrappedCallback);
  }

  void offOrderNew() {
    final callback = _listeners.remove('order:new');
    if (callback != null && _socket != null) {
      _socket?.off('order:new', callback);
    }
  }
}
