'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiGet, apiPost, apiPut } from '@/lib/api';

interface Promo {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  totalUsageLimit: number;
  perUserLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [promoType, setPromoType] = useState('PERCENT');
  const [formCode, setFormCode] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formMinOrder, setFormMinOrder] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<Promo[]>('/promos');
      setPromos(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat promo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setFormCode(''); setPromoType('PERCENT'); setFormValue(''); setFormMinOrder(''); setFormMaxDiscount(''); setFormLimit('');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!formCode.trim() || !formValue) { toast.error('Kode dan nilai wajib diisi'); return; }
    try {
      await apiPost('/promos', {
        code: formCode.toUpperCase(),
        type: promoType,
        value: Number(formValue),
        minOrder: Number(formMinOrder) || 0,
        maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
        totalUsageLimit: Number(formLimit) || 0,
      });
      toast.success(`Promo "${formCode.toUpperCase()}" ditambahkan`);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah promo');
    }
  };

  const handleToggle = async (p: Promo) => {
    try {
      await apiPut(`/promos/${p.id}`, { isActive: !p.isActive });
      toast.success(`Promo "${p.code}" ${p.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Promo</h1>
          <p className="page-subtitle">{promos.length} kode promo</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Promo
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /> Memuat promo...</div>
          ) : promos.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">sell</span>Belum ada promo</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Min. Order</th><th>Penggunaan</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.code}</td>
                    <td><span className="badge gray">{p.type === 'PERCENT' ? 'Persen' : 'Nominal'}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.type === 'PERCENT' ? `${p.value}%` : fmt(p.value)}</td>
                    <td>{fmt(p.minOrder)}</td>
                    <td>{p.usedCount}/{p.totalUsageLimit || '∞'}</td>
                    <td><span className={`badge ${p.isActive ? 'green' : 'gray'}`}>{p.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <ActionMenu items={[
                        { icon: p.isActive ? 'visibility_off' : 'visibility', label: p.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => handleToggle(p) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>sell</span> Tambah Promo</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Kode Promo</label><input className="form-input" placeholder="KODEPROMO" style={{ textTransform: 'uppercase' }} value={formCode} onChange={e => setFormCode(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Tipe</label><CustomSelect value={promoType} onChange={setPromoType} options={[{ value: 'PERCENT', label: 'Persen (%)' }, { value: 'NOMINAL', label: 'Nominal (Rp)' }]} /></div>
                <div className="form-group"><label className="form-label">Nilai</label><input className="form-input" type="number" placeholder="10" value={formValue} onChange={e => setFormValue(e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Min. Order (Rp)</label><input className="form-input" type="number" placeholder="50000" value={formMinOrder} onChange={e => setFormMinOrder(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Max Diskon (Rp)</label><input className="form-input" type="number" placeholder="Opsional" value={formMaxDiscount} onChange={e => setFormMaxDiscount(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Batas Penggunaan</label><input className="form-input" type="number" placeholder="0 = unlimited" value={formLimit} onChange={e => setFormLimit(e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreate}><span className="material-symbols-outlined">save</span> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
