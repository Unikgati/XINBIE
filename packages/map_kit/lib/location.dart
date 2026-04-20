import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

/// GPS location service — permission handling + current position.
class LocationService {
  /// Check and request location permission.
  static Future<bool> requestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;

    return true;
  }

  /// Get current position.
  static Future<LatLng?> getCurrentPosition() async {
    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) return null;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      return LatLng(position.latitude, position.longitude);
    } catch (_) {
      return null;
    }
  }

  /// Stream position updates (for driver GPS tracking).
  static Stream<LatLng> positionStream({
    int intervalMs = 15000,
    int distanceFilterMeters = 10,
  }) {
    return Geolocator.getPositionStream(
      locationSettings: AndroidSettings(
        accuracy: LocationAccuracy.high,
        intervalDuration: Duration(milliseconds: intervalMs),
        distanceFilter: distanceFilterMeters,
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'Dapur Gizi Driver',
          notificationText: 'Lokasi Anda sedang dilacak untuk pengantaran',
          enableWakeLock: true,
        ),
      ),
    ).map((p) => LatLng(p.latitude, p.longitude));
  }
}
