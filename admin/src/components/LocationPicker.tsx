'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');

  // Reverse geocode
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`);
      const data = await res.json();
      if (data.display_name) setAddress(data.display_name);
    } catch { /* silent */ }
  };

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Fix Leaflet default icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.bindPopup('Lokasi Gudang').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstance.current = map;
    markerRef.current = marker;
    reverseGeocode(lat, lng);

    return () => { map.remove(); mapInstance.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current && mapInstance.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
    }
  }, [lat, lng]);

  // GPS browser geolocation
  const getGPSLocation = () => {
    if (!navigator.geolocation) return alert('Browser tidak mendukung GPS');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange(latitude, longitude);
        if (markerRef.current && mapInstance.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          mapInstance.current.setView([latitude, longitude], 17);
        }
        reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        alert(`Gagal mendapatkan lokasi: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-outline btn-sm" type="button" onClick={getGPSLocation} disabled={loading}>
          <span className="material-symbols-outlined">{loading ? 'hourglass_top' : 'my_location'}</span>
          {loading ? 'Mencari...' : 'Gunakan Lokasi Saat Ini'}
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-hint)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
          Klik peta atau drag marker untuk mengubah lokasi
        </div>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: 320, borderRadius: 'var(--radius-md)', border: '1px solid var(--divider)', overflow: 'hidden' }} />

      {address && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginTop: 1 }}>pin_drop</span>
          {address}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>Latitude</label>
          <input className="form-input" value={lat.toFixed(6)} readOnly style={{ background: 'var(--bg)', fontSize: 12 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>Longitude</label>
          <input className="form-input" value={lng.toFixed(6)} readOnly style={{ background: 'var(--bg)', fontSize: 12 }} />
        </div>
      </div>
    </div>
  );
}
