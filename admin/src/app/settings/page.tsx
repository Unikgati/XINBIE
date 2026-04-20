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
    // Driver Commission
    commissionType: 'HYBRID', commissionFixed: '5000', commissionPercent: '80',
    bonusPerKm: '1500', minWithdrawal: '50000', maxWithdrawalDay: '1',
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

        {/* Driver Commission */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">payments</span> Komisi Driver</h3></div>
          <div style={{ padding: 20 }}>
            <div className="alert info" style={{ marginBottom: 16, fontSize: 12 }}>
              <span className="material-symbols-outlined">info</span>
              Komisi otomatis dihitung saat driver menyelesaikan pengiriman. Model Hybrid = Fixed + % dari ongkir.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Model Komisi</label>
                <select className="form-select" value={settings.commissionType} onChange={e => update('commissionType', e.target.value)}>
                  <option value="FIXED">Fixed (tetap per order)</option>
                  <option value="PERCENT">Persentase dari ongkir</option>
                  <option value="HYBRID">Hybrid (Fixed + %)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bonus per KM (Rp)</label>
                <input className="form-input" type="number" value={settings.bonusPerKm} onChange={e => update('bonusPerKm', e.target.value)} />
              </div>
              {(settings.commissionType === 'FIXED' || settings.commissionType === 'HYBRID') && (
                <div className="form-group">
                  <label className="form-label">Komisi Tetap per Order (Rp)</label>
                  <input className="form-input" type="number" value={settings.commissionFixed} onChange={e => update('commissionFixed', e.target.value)} />
                </div>
              )}
              {(settings.commissionType === 'PERCENT' || settings.commissionType === 'HYBRID') && (
                <div className="form-group">
                  <label className="form-label">Komisi % dari Ongkir</label>
                  <input className="form-input" type="number" value={settings.commissionPercent} onChange={e => update('commissionPercent', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Min. Pencairan (Rp)</label>
                <input className="form-input" type="number" value={settings.minWithdrawal} onChange={e => update('minWithdrawal', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Pencairan / Hari</label>
                <input className="form-input" type="number" value={settings.maxWithdrawalDay} onChange={e => update('maxWithdrawalDay', e.target.value)} />
              </div>
            </div>
            {/* Preview */}
            <div style={{ marginTop: 16, padding: 14, background: 'var(--primary-surface)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <strong>Preview komisi (ongkir Rp 10.000):</strong>{' '}
              {settings.commissionType === 'FIXED' && `Rp ${parseInt(settings.commissionFixed || '0').toLocaleString('id-ID')}`}
              {settings.commissionType === 'PERCENT' && `Rp ${Math.round(10000 * parseInt(settings.commissionPercent || '0') / 100).toLocaleString('id-ID')}`}
              {settings.commissionType === 'HYBRID' && `Rp ${(parseInt(settings.commissionFixed || '0') + Math.round(10000 * parseInt(settings.commissionPercent || '0') / 100)).toLocaleString('id-ID')}`}
              {' '}per order
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
