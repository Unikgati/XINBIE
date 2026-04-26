import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:core/core.dart';
import 'package:map_kit/map_kit.dart';
import 'package:ui_kit/ui_kit.dart';
import '../../providers/user_providers.dart';

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({super.key, this.address});
  final Address? address;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  final _mapController = MapController();
  final _geocoding = Geocoding();
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _waController;
  late final TextEditingController _addressController;
  bool _isPrimary = false;

  Timer? _debounce;
  bool _isLoadingAddress = false;
  LatLng _currentCenter = DgMap.defaultCenter;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.address?.recipientName);
    _waController = TextEditingController(text: widget.address?.phoneWa);
    _addressController = TextEditingController(text: widget.address?.fullAddress);
    _isPrimary = widget.address?.isPrimary ?? false;
    
    if (widget.address?.lat != null && widget.address?.lng != null) {
      _currentCenter = LatLng(widget.address!.lat!, widget.address!.lng!);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _mapController.dispose();
    _nameController.dispose();
    _waController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _onMapPositionChanged(MapCamera camera, bool hasGesture) {
    if (!hasGesture) return;
    
    setState(() {
      _currentCenter = camera.center;
    });

    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      _fetchAddressForCoordinate(_currentCenter);
    });
  }

  Future<void> _fetchAddressForCoordinate(LatLng coordinate) async {
    setState(() => _isLoadingAddress = true);
    try {
      final address = await _geocoding.reverseGeocode(coordinate);
      if (address != null && mounted) {
        _addressController.text = address;
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingAddress = false);
      }
    }
  }

  Future<void> _useMyLocation() async {
    setState(() => _isLoadingAddress = true);
    final pos = await LocationService.getCurrentPosition();
    if (pos != null && mounted) {
      _mapController.move(pos, 16.0);
      setState(() {
        _currentCenter = pos;
      });
      // The loading state will be managed by _fetchAddressForCoordinate
      _fetchAddressForCoordinate(pos);
    } else if (mounted) {
      setState(() => _isLoadingAddress = false);
      DgSnackbar.showError(context, message: 'Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin diberikan.');
    }
  }

  bool _isSaving = false;

  Future<void> _onSave() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isSaving = true);
      try {
        if (widget.address == null) {
          await ref.read(addressRepositoryProvider).createAddress(
            label: 'Rumah', // Default label as it is not in the design
            recipientName: _nameController.text,
            phone: _waController.text,
            fullAddress: _addressController.text,
            latitude: _currentCenter.latitude,
            longitude: _currentCenter.longitude,
            isPrimary: _isPrimary,
          );
        } else {
          await ref.read(addressRepositoryProvider).updateAddress(
            widget.address!.id,
            {
              'label': 'Rumah',
              'recipientName': _nameController.text,
              'phoneWa': _waController.text,
              'fullAddress': _addressController.text,
              'lat': _currentCenter.latitude,
              'lng': _currentCenter.longitude,
              'isPrimary': _isPrimary,
            },
          );
        }
        
        ref.invalidate(addressesProvider);
        
        if (mounted) {
          DgSnackbar.showSuccess(context, message: 'Alamat berhasil disimpan');
          context.pop();
        }
      } catch (e) {
        if (mounted) {
          String errMsg = 'Gagal menyimpan alamat.';
          if (e.toString().contains('DioException')) {
            errMsg = 'Koneksi bermasalah atau server error. Coba lagi.';
          } else {
            errMsg = 'Gagal menyimpan alamat: $e';
          }
          
          DgSnackbar.showError(context, message: errMsg);
        }
      } finally {
        if (mounted) setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          widget.address == null ? 'Tambah Alamat' : 'Edit Alamat',
          style: AppTypography.h3.copyWith(color: AppColors.primaryDark),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // 1. Peta (Mengisi sisa ruang atas layar)
          Expanded(
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Peta dibocorkan 24px ke bawah agar masuk ke bawah rounded corner form
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: -24,
                  child: DgMap(
                    mapController: _mapController,
                    center: _currentCenter,
                    onPositionChanged: _onMapPositionChanged,
                  ),
                ),
                // Pin tetap di tengah persis dari ruang yang terlihat
                const Center(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 32),
                    child: Icon(Icons.location_on, size: 40, color: AppColors.error),
                  ),
                ),
                // Tombol Lokasi Saat Ini (Pojok Kanan Bawah Peta)
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: FloatingActionButton(
                    mini: true,
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primaryDark,
                    onPressed: _useMyLocation,
                    child: const Icon(Icons.my_location),
                  ),
                ),
                if (_isLoadingAddress)
                  Positioned(
                    top: 16,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                            SizedBox(width: 8),
                            Text('Mencari lokasi...', style: TextStyle(color: Colors.white, fontSize: 12)),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // 2. Form bergaya Bottom Sheet (Setengah Layar Bawah)
          Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.55,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [
                BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -5)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                // Form fields
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: 'Nama Penerima',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.primary),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.border),
                              ),
                            ),
                            validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _waController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Nomor WhatsApp',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.primary),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.border),
                              ),
                            ),
                            validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _addressController,
                            maxLines: 4,
                            decoration: InputDecoration(
                              labelText: 'Alamat Lengkap',
                              alignLabelWithHint: true,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.primary),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.border),
                              ),
                            ),
                            validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Jadikan Alamat Utama',
                                style: AppTypography.bodyMedium.copyWith(color: AppColors.textPrimary),
                              ),
                              Switch(
                                value: _isPrimary,
                                activeColor: AppColors.primary,
                                onChanged: (val) {
                                  setState(() {
                                    _isPrimary = val;
                                  });
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),
                          DgButton(
                            label: _isSaving ? 'Menyimpan...' : 'Simpan Alamat',
                            onPressed: _isSaving ? () {} : _onSave,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
