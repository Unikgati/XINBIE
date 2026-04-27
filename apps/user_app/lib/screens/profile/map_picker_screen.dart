import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:map_kit/map_kit.dart';
import 'package:ui_kit/ui_kit.dart';

/// Full-screen map picker that returns a LatLng when user confirms.
/// Usage: final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => MapPickerScreen(initial: ...)));
class MapPickerScreen extends StatefulWidget {
  const MapPickerScreen({super.key, this.initial});
  final LatLng? initial;

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  final _mapController = MapController();
  late LatLng _currentCenter;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _currentCenter = widget.initial ?? DgMap.defaultCenter;
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _onMapPositionChanged(MapCamera camera, bool hasGesture) {
    if (!hasGesture) return;
    setState(() {
      _currentCenter = camera.center;
    });
  }

  Future<void> _useMyLocation() async {
    setState(() => _isLoading = true);
    final pos = await LocationService.getCurrentPosition();
    if (pos != null && mounted) {
      _mapController.move(pos, 16.0);
      setState(() {
        _currentCenter = pos;
        _isLoading = false;
      });
    } else if (mounted) {
      setState(() => _isLoading = false);
      DgSnackbar.showError(context, message: 'Gagal mendapatkan lokasi. Pastikan GPS aktif.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'Pilih Lokasi di Peta',
          style: AppTypography.h4.copyWith(color: AppColors.primaryDark),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.textSecondary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          DgMap(
            mapController: _mapController,
            center: _currentCenter,
            onPositionChanged: _onMapPositionChanged,
          ),
          // Center pin
          const Center(
            child: Padding(
              padding: EdgeInsets.only(bottom: 32),
              child: Icon(Icons.location_on, size: 40, color: AppColors.error),
            ),
          ),
          // My Location button
          Positioned(
            right: 16,
            bottom: 100,
            child: FloatingActionButton(
              mini: true,
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primaryDark,
              onPressed: _useMyLocation,
              child: _isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.my_location),
            ),
          ),
          // Confirm button
          Positioned(
            left: 24,
            right: 24,
            bottom: 32,
            child: DgButton(
              label: 'Konfirmasi Lokasi',
              onPressed: () => Navigator.pop(context, _currentCenter),
            ),
          ),
          // Coordinate display
          Positioned(
            top: 16,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${_currentCenter.latitude.toStringAsFixed(6)}, ${_currentCenter.longitude.toStringAsFixed(6)}',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'monospace'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
