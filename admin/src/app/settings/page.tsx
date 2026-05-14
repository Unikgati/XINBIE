'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { FormSkeleton } from '@/components/Skeleton';
import { apiGet, apiPut } from '@/lib/api';

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

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div><h1 className="page-title">Pengaturan</h1><p className="page-subtitle">Konfigurasi toko dan pengiriman</p></div>
        </div>
        <div className="page-body">
          <div className="data-card" style={{ marginBottom: 16 }}>
            <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">hourglass_empty</span> Memuat pengaturan...</h3></div>
            <FormSkeleton rows={3} />
          </div>
        </div>
      </>
    );
  }



  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Konfigurasi toko dan aplikasi</p>
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
              <div className="form-group"><label className="form-label">WhatsApp Admin</label><input className="form-input" value={settings.admin_wa || ''} onChange={e => update('admin_wa', e.target.value)} placeholder="628..." /></div>
              <div className="form-group"><label className="form-label">Versi App Min</label><input className="form-input" value={settings.app_version_min || ''} onChange={e => update('app_version_min', e.target.value)} placeholder="1.0.0" /></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
