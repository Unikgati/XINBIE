'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import — Leaflet requires window object (no SSR)
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'Dapur Gizi', phone: '0812-3456-7890', email: 'info@dapurgizi.com',
    address: 'Jl. Sudirman No. 15, Jakarta', lat: -6.200000, lng: 106.816666,
    deliveryRadius: '10', baseDeliveryFee: '5000', freeDeliveryMin: '150000',
    operationalStart: '07:00', operationalEnd: '20:00', maxOrderPerSlot: '10',
  });
  const update = (key: string, value: string | number) => setSettings(prev => ({ ...prev, [key]: value }));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Konfigurasi toko dan pengiriman</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <span className="material-symbols-outlined">save</span> Simpan
        </button>
      </div>
      <div className="page-body">
        {saved && (
          <div className="alert success" style={{ marginBottom: 16 }}>
            <span className="material-symbols-outlined">check_circle</span> Pengaturan berhasil disimpan!
          </div>
        )}

        {/* Store Info */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">storefront</span> Informasi Toko</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Nama Toko</label><input className="form-input" value={settings.storeName} onChange={e => update('storeName', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={settings.email} onChange={e => update('email', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={settings.phone} onChange={e => update('phone', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Alamat</label><input className="form-input" value={settings.address} onChange={e => update('address', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Location — Map Picker */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">pin_drop</span> Lokasi Gudang / Drop Point</h3></div>
          <div style={{ padding: 20 }}>
            <LocationPicker
              lat={settings.lat}
              lng={settings.lng}
              onChange={(lat, lng) => {
                update('lat', lat);
                update('lng', lng);
              }}
            />
          </div>
        </div>

        {/* Delivery */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">local_shipping</span> Pengiriman</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Radius Pengiriman (km)</label><input className="form-input" type="number" value={settings.deliveryRadius} onChange={e => update('deliveryRadius', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Biaya Dasar (Rp)</label><input className="form-input" type="number" value={settings.baseDeliveryFee} onChange={e => update('baseDeliveryFee', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Min. Gratis Ongkir (Rp)</label><input className="form-input" type="number" value={settings.freeDeliveryMin} onChange={e => update('freeDeliveryMin', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Max Order per Slot</label><input className="form-input" type="number" value={settings.maxOrderPerSlot} onChange={e => update('maxOrderPerSlot', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Operational Hours */}
        <div className="data-card">
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">schedule</span> Jam Operasional</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Buka</label><input className="form-input" type="time" value={settings.operationalStart} onChange={e => update('operationalStart', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Tutup</label><input className="form-input" type="time" value={settings.operationalEnd} onChange={e => update('operationalEnd', e.target.value)} /></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
