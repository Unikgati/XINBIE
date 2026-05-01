import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../repositories/driver_repository.dart';
import '../constants/app_config.dart';

/// Background GPS tracker for driver — sends location to backend.
///
/// Intervals:
/// - IN_DELIVERY: 15s (active delivery)
/// - ONLINE idle: 60s (waiting for orders)
class DriverLocationService {
  DriverLocationService(this._driverRepo);

  final DriverRepository _driverRepo;
  Timer? _timer;
  bool _isTracking = false;
  String _mode = 'idle'; // 'idle' | 'delivery'

  bool get isTracking => _isTracking;

  /// Start location tracking.
  Future<bool> start({String mode = 'idle'}) async {
    _mode = mode;

    // Check permission
    final permission = await _checkPermission();
    if (!permission) return false;

    _isTracking = true;
    _scheduleUpdate();
    // Send first location immediately
    await _sendLocation();
    return true;
  }

  /// Stop tracking.
  void stop() {
    _isTracking = false;
    _timer?.cancel();
    _timer = null;
  }

  /// Switch mode (changes interval).
  void setMode(String mode) {
    if (_mode == mode) return;
    _mode = mode;
    if (_isTracking) {
      _timer?.cancel();
      _scheduleUpdate();
    }
  }

  void _scheduleUpdate() {
    final interval = _mode == 'delivery'
        ? const Duration(seconds: 15)
        : const Duration(seconds: 60);

    _timer = Timer.periodic(interval, (_) => _sendLocation());
  }

  Future<void> _sendLocation() async {
    if (!_isTracking) return;

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      await _driverRepo.updateLocation(
        latitude: position.latitude,
        longitude: position.longitude,
      );
    } catch (_) {
      // Silently fail — will retry next interval
    }
  }

  Future<bool> _checkPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;

    return true;
  }

  void dispose() {
    stop();
  }
}

/// Provider for DriverLocationService.
final driverLocationServiceProvider = Provider<DriverLocationService>((ref) {
  final repo = ref.watch(driverRepositoryProvider);
  final service = DriverLocationService(repo);
  ref.onDispose(() => service.dispose());
  return service;
});
