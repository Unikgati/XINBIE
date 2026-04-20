import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';

/// OSRM routing client — get route polyline + distance + duration.
class Routing {
  Routing({String? osrmUrl})
      : _osrmUrl = osrmUrl ?? 'https://router.project-osrm.org';

  final String _osrmUrl;
  final _dio = Dio();

  /// Get route between two points.
  Future<RouteResult?> getRoute(LatLng from, LatLng to) async {
    try {
      final response = await _dio.get(
        '$_osrmUrl/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}',
        queryParameters: {
          'overview': 'full',
          'geometries': 'geojson',
        },
      );

      final route = response.data['routes'][0];
      final coords = route['geometry']['coordinates'] as List;

      return RouteResult(
        points: coords
            .map<LatLng>((c) => LatLng(c[1].toDouble(), c[0].toDouble()))
            .toList(),
        distanceMeters: (route['distance'] as num).toDouble(),
        durationSeconds: (route['duration'] as num).toDouble(),
      );
    } catch (_) {
      return null;
    }
  }
}

class RouteResult {
  const RouteResult({
    required this.points,
    required this.distanceMeters,
    required this.durationSeconds,
  });

  final List<LatLng> points;
  final double distanceMeters;
  final double durationSeconds;

  double get distanceKm => distanceMeters / 1000;
  int get durationMinutes => (durationSeconds / 60).ceil();

  String get distanceText => '${distanceKm.toStringAsFixed(1)} km';
  String get durationText => '±$durationMinutes menit';
}
