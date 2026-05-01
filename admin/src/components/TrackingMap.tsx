'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  lat: number;
  lng: number;
  name: string;
  height?: number | string;
}

export default function TrackingMap({ lat, lng, name, height = 250 }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`Lokasi ${name}`);

    mapInstance.current = map;
    markerRef.current = marker;

    // Fix map not loading tiles properly inside modals/lightboxes
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

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

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-subtle)', height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
