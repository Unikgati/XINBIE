import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// Preconfigured flutter_map widget with OSM tiles.
class DgMap extends StatelessWidget {
  const DgMap({
    super.key,
    this.center,
    this.zoom = 15.0,
    this.markers = const [],
    this.polylines = const [],
    this.onTap,
    this.onPositionChanged,
    this.mapController,
    this.interactionOptions,
  });

  final LatLng? center;
  final double zoom;
  final List<Marker> markers;
  final List<Polyline> polylines;
  final void Function(TapPosition, LatLng)? onTap;
  final void Function(MapCamera, bool)? onPositionChanged;
  final MapController? mapController;
  final InteractionOptions? interactionOptions;

  /// Default center: Jakarta, Indonesia
  static const LatLng defaultCenter = LatLng(-6.2088, 106.8456);

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: mapController,
      options: MapOptions(
        initialCenter: center ?? defaultCenter,
        initialZoom: zoom,
        onTap: onTap,
        onPositionChanged: onPositionChanged,
        interactionOptions: interactionOptions ??
            const InteractionOptions(
              flags: InteractiveFlag.all,
            ),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.dapurgizi',
          maxZoom: 19,
        ),
        if (polylines.isNotEmpty) PolylineLayer(polylines: polylines),
        if (markers.isNotEmpty) MarkerLayer(markers: markers),
      ],
    );
  }
}
