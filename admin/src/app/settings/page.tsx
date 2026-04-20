'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { apiGet, apiPut } from '@/lib/api';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<Record<string, string>>('/settings');
      setSettings(res || {});
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiPut('/settings', settings);
      toast.success('Pengaturan berhasil disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /> Memuat pengaturan...</div>;

  const commType = settings.commission_type || 'HYBRID';

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Konfigurasi toko dan pengiriman</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="material-symbols-outlined">save</span> {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
      <div className="page-body">
        {/* Store Info */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">storefront</span> Informasi Toko</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">WhatsApp Admin</label><input className="form-input" value={settings.admin_wa || ''} onChange={e => update('admin_wa', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Versi App Min</label><input className="form-input" value={settings.app_version_min || ''} onChange={e => update('app_version_min', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">local_shipping</span> Pengiriman</h3></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Radius Pengiriman (km)</label><input className="form-input" type="number" value={settings.delivery_radius_km || ''} onChange={e => update('delivery_radius_km', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Ongkir Reguler (Rp)</label><input className="form-input" type="number" value={settings.regular_delivery_fee || ''} onChange={e => update('regular_delivery_fee', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Ongkir Instant (Rp)</label><input className="form-input" type="number" value={settings.instant_delivery_fee || ''} onChange={e => update('instant_delivery_fee', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Min. Gratis Ongkir (Rp)</label><input className="form-input" type="number" value={settings.free_delivery_min || ''} onChange={e => update('free_delivery_min', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Min. Order (Rp)</label><input className="form-input" type="number" value={settings.min_order_amount || ''} onChange={e => update('min_order_amount', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Max Item per Order</label><input className="form-input" type="number" value={settings.max_order_items || ''} onChange={e => update('max_order_items', e.target.value)} /></div>
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
                <CustomSelect
                  value={commType}
                  onChange={v => update('commission_type', v)}
                  options={[
                    { value: 'FIXED', label: 'Fixed (tetap per order)' },
                    { value: 'PERCENT', label: 'Persentase dari ongkir' },
                    { value: 'HYBRID', label: 'Hybrid (Fixed + %)' },
                  ]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bonus per KM (Rp)</label>
                <input className="form-input" type="number" value={settings.commission_bonus_per_km || ''} onChange={e => update('commission_bonus_per_km', e.target.value)} />
              </div>
              {(commType === 'FIXED' || commType === 'HYBRID') && (
                <div className="form-group">
                  <label className="form-label">Komisi Tetap per Order (Rp)</label>
                  <input className="form-input" type="number" value={settings.commission_fixed || ''} onChange={e => update('commission_fixed', e.target.value)} />
                </div>
              )}
              {(commType === 'PERCENT' || commType === 'HYBRID') && (
                <div className="form-group">
                  <label className="form-label">Komisi % dari Ongkir</label>
                  <input className="form-input" type="number" value={settings.commission_percent || ''} onChange={e => update('commission_percent', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Min. Pencairan (Rp)</label>
                <input className="form-input" type="number" value={settings.min_withdrawal || ''} onChange={e => update('min_withdrawal', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Pencairan / Hari</label>
                <input className="form-input" type="number" value={settings.max_withdrawal_per_day || ''} onChange={e => update('max_withdrawal_per_day', e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 14, background: 'var(--primary-surface)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <strong>Preview komisi (ongkir Rp 10.000):</strong>{' '}
              {commType === 'FIXED' && `Rp ${parseInt(settings.commission_fixed || '0').toLocaleString('id-ID')}`}
              {commType === 'PERCENT' && `Rp ${Math.round(10000 * parseInt(settings.commission_percent || '0') / 100).toLocaleString('id-ID')}`}
              {commType === 'HYBRID' && `Rp ${(parseInt(settings.commission_fixed || '0') + Math.round(10000 * parseInt(settings.commission_percent || '0') / 100)).toLocaleString('id-ID')}`}
              {' '}per order
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
