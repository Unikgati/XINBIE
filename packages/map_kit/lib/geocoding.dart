import 'package:dio/dio.dart';
import 'package:core/constants/app_config.dart';
import 'package:latlong2/latlong.dart';

/// Nominatim geocoding client (reverse & forward).
class Geocoding {
  Geocoding({String? nominatimUrl})
      : _nominatimUrl = nominatimUrl ?? 'https://nominatim.openstreetmap.org';

  final String _nominatimUrl;
  final _dio = Dio(BaseOptions(headers: {'User-Agent': 'com.dapurgizi.app'}));

  /// Reverse geocode: LatLng → address string.
  Future<String?> reverseGeocode(LatLng point) async {
    try {
      final response = await _dio.get('$_nominatimUrl/reverse', queryParameters: {
        'lat': point.latitude,
        'lon': point.longitude,
        'format': 'json',
        'addressdetails': 1,
        'accept-language': 'id',
      });
      return response.data['display_name'] as String?;
    } catch (_) {
      return null;
    }
  }

  /// Forward geocode: query string → list of results.
  Future<List<GeocodingResult>> search(String query) async {
    try {
      final response = await _dio.get('$_nominatimUrl/search', queryParameters: {
        'q': query,
        'format': 'json',
        'limit': 5,
        'accept-language': 'id',
      });
      return (response.data as List)
          .map((e) => GeocodingResult(
                lat: double.parse(e['lat']),
                lng: double.parse(e['lon']),
                displayName: e['display_name'],
              ))
          .toList();
    } catch (_) {
      return [];
    }
  }
}

class GeocodingResult {
  const GeocodingResult({
    required this.lat,
    required this.lng,
    required this.displayName,
  });

  final double lat;
  final double lng;
  final String displayName;

  LatLng get latLng => LatLng(lat, lng);
}
