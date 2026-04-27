import 'package:flutter/material.dart';

import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:core/core.dart';

import 'package:ui_kit/ui_kit.dart';
import '../../providers/user_providers.dart';
import 'map_picker_screen.dart';

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({super.key, this.address});
  final Address? address;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _waController;
  late final TextEditingController _addressController;
  bool _isPrimary = false;
  bool _isSaving = false;

  // Region state
  List<Region> _provinces = [];
  List<Region> _cities = [];
  List<Region> _districts = [];
  List<Region> _villages = [];

  Region? _selectedProvince;
  Region? _selectedCity;
  Region? _selectedDistrict;
  Region? _selectedVillage;

  bool _loadingProvinces = true;
  bool _loadingCities = false;
  bool _loadingDistricts = false;
  bool _loadingVillages = false;

  // GPS (optional)
  LatLng? _gpsLocation;

  @override
  void initState() {
    super.initState();
    final addr = widget.address;
    _nameController = TextEditingController(text: addr?.recipientName);
    _waController = TextEditingController(text: addr?.phoneWa);
    _addressController = TextEditingController(text: addr?.fullAddress);
    _isPrimary = addr?.isPrimary ?? false;

    if (addr?.lat != null && addr?.lng != null) {
      _gpsLocation = LatLng(addr!.lat!, addr.lng!);
    }

    _loadProvinces();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _waController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  // ─── Region loading ───
  Future<void> _loadProvinces() async {
    try {
      final provinces = await ref.read(regionRepositoryProvider).getProvinces();
      if (!mounted) return;
      setState(() {
        _provinces = provinces;
        _loadingProvinces = false;
      });
      // Auto-select if only 1 province
      if (provinces.length == 1) {
        _selectedProvince = provinces.first;
        await _onProvinceChanged(provinces.first, restore: widget.address != null);
      } else if (widget.address?.provinceId != null) {
        // If editing, restore selections
        final prov = provinces.where((p) => p.id == widget.address!.provinceId).firstOrNull;
        if (prov != null) {
          _selectedProvince = prov;
          await _onProvinceChanged(prov, restore: true);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _loadingProvinces = false);
    }
  }

  Future<void> _onProvinceChanged(Region? province, {bool restore = false}) async {
    setState(() {
      _selectedProvince = province;
      if (!restore) {
        _selectedCity = null;
        _selectedDistrict = null;
        _selectedVillage = null;
        _cities = [];
        _districts = [];
        _villages = [];
      }
      _loadingCities = province != null;
    });
    if (province == null) return;

    try {
      final cities = await ref.read(regionRepositoryProvider).getCities(province.id);
      if (!mounted) return;
      setState(() {
        _cities = cities;
        _loadingCities = false;
      });
      if (restore && widget.address?.cityId != null) {
        final city = cities.where((c) => c.id == widget.address!.cityId).firstOrNull;
        if (city != null) {
          _selectedCity = city;
          await _onCityChanged(city, restore: true);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _loadingCities = false);
    }
  }

  Future<void> _onCityChanged(Region? city, {bool restore = false}) async {
    setState(() {
      _selectedCity = city;
      if (!restore) {
        _selectedDistrict = null;
        _selectedVillage = null;
        _districts = [];
        _villages = [];
      }
      _loadingDistricts = city != null;
    });
    if (city == null) return;

    try {
      final districts = await ref.read(regionRepositoryProvider).getDistricts(city.id);
      if (!mounted) return;
      setState(() {
        _districts = districts;
        _loadingDistricts = false;
      });
      if (restore && widget.address?.districtId != null) {
        final dist = districts.where((d) => d.id == widget.address!.districtId).firstOrNull;
        if (dist != null) {
          _selectedDistrict = dist;
          await _onDistrictChanged(dist, restore: true);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _loadingDistricts = false);
    }
  }

  Future<void> _onDistrictChanged(Region? district, {bool restore = false}) async {
    setState(() {
      _selectedDistrict = district;
      if (!restore) {
        _selectedVillage = null;
        _villages = [];
      }
      _loadingVillages = district != null;
    });
    if (district == null) return;

    try {
      final villages = await ref.read(regionRepositoryProvider).getVillages(district.id);
      if (!mounted) return;
      setState(() {
        _villages = villages;
        _loadingVillages = false;
      });
      if (restore && widget.address?.villageId != null) {
        final vil = villages.where((v) => v.id == widget.address!.villageId).firstOrNull;
        if (vil != null) {
          setState(() => _selectedVillage = vil);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _loadingVillages = false);
    }
  }

  // ─── Map Picker ───
  Future<void> _openMapPicker() async {
    final result = await Navigator.push<LatLng>(
      context,
      MaterialPageRoute(builder: (_) => MapPickerScreen(initial: _gpsLocation)),
    );
    if (result != null && mounted) {
      setState(() => _gpsLocation = result);
    }
  }

  // ─── Save ───
  Future<void> _onSave() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    // Validate region
    if (_selectedProvince == null || _selectedCity == null || _selectedDistrict == null || _selectedVillage == null) {
      DgSnackbar.showError(context, message: 'Mohon lengkapi data wilayah (Provinsi s/d Kelurahan)');
      return;
    }

    setState(() => _isSaving = true);
    try {
      if (widget.address == null) {
        await ref.read(addressRepositoryProvider).createAddress(
          label: 'Rumah',
          recipientName: _nameController.text.trim(),
          phone: _waController.text.trim(),
          fullAddress: _addressController.text.trim(),
          notes: null, // Removed separate notes field
          latitude: _gpsLocation?.latitude,
          longitude: _gpsLocation?.longitude,
          provinceId: _selectedProvince!.id,
          cityId: _selectedCity!.id,
          districtId: _selectedDistrict!.id,
          villageId: _selectedVillage!.id,
          isPrimary: _isPrimary,
        );
      } else {
        await ref.read(addressRepositoryProvider).updateAddress(
          widget.address!.id,
          {
            'recipientName': _nameController.text.trim(),
            'phoneWa': _waController.text.trim(),
            'fullAddress': _addressController.text.trim(),
            'notes': null, // Removed separate notes field
            'lat': _gpsLocation?.latitude,
            'lng': _gpsLocation?.longitude,
            'provinceId': _selectedProvince!.id,
            'cityId': _selectedCity!.id,
            'districtId': _selectedDistrict!.id,
            'villageId': _selectedVillage!.id,
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
        DgSnackbar.showError(context, message: 'Gagal menyimpan alamat: $e');
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  // ─── Searchable Bottom Sheet ───
  Future<Region?> _showRegionPicker(String title, List<Region> items) async {
    return showModalBottomSheet<Region>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _RegionPickerSheet(title: title, items: items),
    );
  }

  // Removed _inputDecoration to use default theme

  // ─── Region Dropdown Tile ───
  Widget _regionDropdown({
    required String label,
    required Region? selected,
    required List<Region> items,
    required bool loading,
    required bool enabled,
    required ValueChanged<Region?> onSelected,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelLarge),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: !enabled || loading || items.isEmpty
              ? null
              : () async {
                  final result = await _showRegionPicker(label, items);
                  if (result != null) onSelected(result);
                },
          child: InputDecorator(
            decoration: InputDecoration(
              hintText: 'Pilih $label',
              enabled: enabled,
            ),
            isEmpty: selected == null,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: loading
                      ? const Align(
                          alignment: Alignment.centerLeft,
                          child: SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                        )
                      : Text(
                          selected?.name ?? '',
                          style: AppTypography.bodyMedium.copyWith(
                            color: selected != null ? AppColors.textPrimary : AppColors.textHint,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                ),
                Icon(Icons.keyboard_arrow_down, color: enabled ? AppColors.textHint : AppColors.border),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── Personal Info ───
              Text('Nama Penerima', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(hintText: 'Masukkan nama penerima'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              Text('Nomor WhatsApp', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _waController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(hintText: 'Contoh: 081234567890'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Wajib diisi' : null,
              ),

              const SizedBox(height: 24),

              // ─── Region Section ───
              Text('Wilayah', style: AppTypography.labelLarge.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text('Pilih wilayah untuk memudahkan proses pengiriman', style: AppTypography.bodySmall.copyWith(color: AppColors.textHint)),
              const SizedBox(height: 12),

              if (_provinces.length > 1) ...[
                _regionDropdown(
                  label: 'Provinsi',
                  selected: _selectedProvince,
                  items: _provinces,
                  loading: _loadingProvinces,
                  enabled: !_loadingProvinces,
                  onSelected: (r) => _onProvinceChanged(r),
                ),
                const SizedBox(height: 12),
              ],
              _regionDropdown(
                label: 'Kabupaten / Kota',
                selected: _selectedCity,
                items: _cities,
                loading: _loadingCities,
                enabled: _selectedProvince != null && !_loadingCities,
                onSelected: (r) => _onCityChanged(r),
              ),
              const SizedBox(height: 12),
              _regionDropdown(
                label: 'Kecamatan',
                selected: _selectedDistrict,
                items: _districts,
                loading: _loadingDistricts,
                enabled: _selectedCity != null && !_loadingDistricts,
                onSelected: (r) => _onDistrictChanged(r),
              ),
              const SizedBox(height: 12),
              _regionDropdown(
                label: 'Kelurahan / Desa',
                selected: _selectedVillage,
                items: _villages,
                loading: _loadingVillages,
                enabled: _selectedDistrict != null && !_loadingVillages,
                onSelected: (r) => setState(() => _selectedVillage = r),
              ),

              const SizedBox(height: 24),

              // ─── Address Detail ───
              Text('Alamat Lengkap', style: AppTypography.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                controller: _addressController,
                maxLines: 3,
                maxLength: 200,
                decoration: const InputDecoration(hintText: 'Cth: Jl. Raya No.1, RT/RW, Patokan'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Wajib diisi' : null,
              ),

              const SizedBox(height: 24),

              // ─── GPS Section (Optional) ───
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 20, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          'Bantu driver menemukanmu',
                          style: AppTypography.labelLarge.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.w600),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text('Opsional', style: TextStyle(fontSize: 10, color: AppColors.primaryDark, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tandai lokasi di peta agar driver lebih mudah menemukan alamatmu.',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),

                    if (_gpsLocation != null) ...[
                      // Mini map preview
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          height: 120,
                          child: IgnorePointer(
                            child: FlutterMap(
                              options: MapOptions(
                                initialCenter: _gpsLocation!,
                                initialZoom: 15,
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                  userAgentPackageName: 'com.dapurgizi',
                                ),
                                MarkerLayer(markers: [
                                  Marker(
                                    point: _gpsLocation!,
                                    width: 30,
                                    height: 30,
                                    child: const Icon(Icons.location_on, color: AppColors.error, size: 30),
                                  ),
                                ]),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${_gpsLocation!.latitude.toStringAsFixed(6)}, ${_gpsLocation!.longitude.toStringAsFixed(6)}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textHint, fontFamily: 'monospace'),
                            ),
                          ),
                          TextButton.icon(
                            onPressed: _openMapPicker,
                            icon: const Icon(Icons.edit_location_alt, size: 16),
                            label: const Text('Ubah'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                        ],
                      ),
                    ] else
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _openMapPicker,
                          icon: const Icon(Icons.map_outlined, size: 18),
                          label: const Text('Tandai di Peta'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primaryDark,
                            side: const BorderSide(color: AppColors.primary),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // ─── Primary Toggle ───
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
                    onChanged: (val) => setState(() => _isPrimary = val),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // ─── Save Button ───
              DgButton(
                label: 'Simpan Alamat',
                onPressed: _onSave,
                isLoading: _isSaving,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Searchable Region Picker Bottom Sheet ───
class _RegionPickerSheet extends StatefulWidget {
  const _RegionPickerSheet({required this.title, required this.items});
  final String title;
  final List<Region> items;

  @override
  State<_RegionPickerSheet> createState() => _RegionPickerSheetState();
}

class _RegionPickerSheetState extends State<_RegionPickerSheet> {
  String _query = '';

  List<Region> get _filtered {
    if (_query.isEmpty) return widget.items;
    final q = _query.toLowerCase();
    return widget.items.where((r) => r.name.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (ctx, scrollController) {
        return Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              child: Text('Pilih ${widget.title}', style: AppTypography.h4.copyWith(fontWeight: FontWeight.w700)),
            ),
            // Search
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
              child: TextField(
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Cari ${widget.title.toLowerCase()}...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primary),
                  ),
                ),
                onChanged: (v) => setState(() => _query = v),
              ),
            ),
            // List
            Expanded(
              child: _filtered.isEmpty
                  ? Center(child: Text('Tidak ditemukan', style: AppTypography.bodyMedium.copyWith(color: AppColors.textHint)))
                  : ListView.builder(
                      controller: scrollController,
                      itemCount: _filtered.length,
                      itemBuilder: (ctx, i) {
                        final item = _filtered[i];
                        return ListTile(
                          title: Text(item.name, style: AppTypography.bodyMedium),
                          dense: true,
                          onTap: () => Navigator.pop(context, item),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}
