'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'Dapur Gizi', phone: '0812-3456-7890', email: 'info@dapurgizi.com',
    address: 'Jl. Sudirman No. 15, Jakarta', lat: '-6.200000', lng: '106.816666',
    deliveryRadius: '10', baseDeliveryFee: '5000', freeDeliveryMin: '150000',
    operationalStart: '07:00', operationalEnd: '20:00', maxOrderPerSlot: '10',
  });
  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Konfigurasi toko dan pengiriman</p>
        </div>
        <button className="btn btn-primary"><span className="material-symbols-outlined">save</span> Simpan</button>
      </div>
      <div className="page-body">
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">storefront</span> Informasi Toko</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Nama Toko</label><input className="form-input" value={settings.storeName} onChange={e => update('storeName', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={settings.email} onChange={e => update('email', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={settings.phone} onChange={e => update('phone', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Alamat</label><input className="form-input" value={settings.address} onChange={e => update('address', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" value={settings.lat} onChange={e => update('lat', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" value={settings.lng} onChange={e => update('lng', e.target.value)} /></div>
            </div>
          </div>
        </div>
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
