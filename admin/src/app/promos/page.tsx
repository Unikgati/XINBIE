'use client';

import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
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
  startAt?: string;
  endAt?: string;
  allowCod: boolean;
  allowedPaymentMethods: string[];
}

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Bayar di Tempat (COD)' },
  { value: 'GoPay', label: 'GoPay' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'VA_BCA', label: 'BCA Virtual Account' },
  { value: 'VA_MANDIRI', label: 'Mandiri Virtual Account' },
  { value: 'VA_BNI', label: 'BNI Virtual Account' },
  { value: 'Alfamart', label: 'Alfamart' },
  { value: 'Indomaret', label: 'Indomaret' },
];

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const selectStyles = {
  control: (base: any) => ({ ...base, background: 'var(--surface)', borderColor: 'var(--divider)', borderRadius: 'var(--radius-md)', minHeight: 40, fontSize: 14 }),
  menu: (base: any) => ({ ...base, background: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  option: (base: any, state: any) => ({ ...base, background: state.isFocused ? 'var(--primary-surface)' : 'transparent', color: 'var(--text-primary)', fontSize: 13 }),
  multiValue: (base: any) => ({ ...base, background: 'var(--primary-surface)', borderRadius: 12 }),
  multiValueLabel: (base: any) => ({ ...base, color: 'var(--primary-dark)', fontSize: 12, fontWeight: 500, padding: '2px 6px' }),
  multiValueRemove: (base: any) => ({ ...base, color: 'var(--primary)', borderRadius: '0 12px 12px 0', ':hover': { background: 'var(--primary-light)', color: '#fff' } }),
  input: (base: any) => ({ ...base, color: 'var(--text-primary)' }),
  placeholder: (base: any) => ({ ...base, color: 'var(--text-hint)', fontSize: 13 }),
};

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [promoType, setPromoType] = useState('PERCENT');
  const [formCode, setFormCode] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formMinOrder, setFormMinOrder] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formPerUserLimit, setFormPerUserLimit] = useState('1');
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formAllowCod, setFormAllowCod] = useState(true);
  const [formAllowedPayments, setFormAllowedPayments] = useState<string[]>([]);
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formProductIds, setFormProductIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, cRes, prRes] = await Promise.all([
        apiGet<Promo[]>('/promos'),
        apiGet<any[]>('/categories'),
        apiGet<any>('/products?limit=100'),
      ]);
      setPromos(Array.isArray(pRes) ? pRes : []);
      setCategories(Array.isArray(cRes) ? cRes : []);
      setAllProducts(Array.isArray(prRes?.data) ? prRes.data : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setFormCode(''); setPromoType('PERCENT'); setFormValue(''); setFormMinOrder(''); setFormMaxDiscount(''); setFormLimit('');
    setFormPerUserLimit('1'); setFormStartAt(''); setFormEndAt(''); setFormAllowCod(true);
    setFormAllowedPayments([]);
    setFormCategoryIds([]); setFormProductIds([]);
    setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditingId(p.id);
    setFormCode(p.code); setPromoType(p.type); setFormValue(p.value.toString()); 
    setFormMinOrder(p.minOrder.toString()); setFormMaxDiscount(p.maxDiscount?.toString() || ''); 
    setFormLimit(p.totalUsageLimit.toString()); setFormPerUserLimit(p.perUserLimit.toString());
    setFormStartAt(p.startAt ? new Date(p.startAt).toISOString().slice(0, 10) : '');
    setFormEndAt(p.endAt ? new Date(p.endAt).toISOString().slice(0, 10) : '');
    setFormAllowCod(p.allowCod);
    setFormAllowedPayments(p.allowedPaymentMethods || []);
    setFormCategoryIds(p.categories?.map((c: any) => c.id) || []);
    setFormProductIds(p.products?.map((pr: any) => pr.id) || []);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formCode.trim() || !formValue) { toast.error('Kode dan nilai wajib diisi'); return; }
    try {
      const payload = {
        code: formCode.toUpperCase(),
        type: promoType,
        value: Number(formValue),
        minOrder: Number(formMinOrder) || 0,
        maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
        totalUsageLimit: Number(formLimit) || 0,
        perUserLimit: Number(formPerUserLimit) || 1,
        startAt: formStartAt || undefined,
        endAt: formEndAt || undefined,
        allowCod: formAllowCod,
        allowedPaymentMethods: formAllowedPayments,
        categoryIds: formCategoryIds,
        productIds: formProductIds,
      };

      if (editingId) {
        await apiPut(`/promos/${editingId}`, payload);
        toast.success(`Promo "${formCode.toUpperCase()}" diperbarui`);
      } else {
        await apiPost('/promos', payload);
        toast.success(`Promo "${formCode.toUpperCase()}" ditambahkan`);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan promo');
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
          <h1 className="page-title">Promo & Voucher</h1>
          <p className="page-subtitle">{promos.length} kode promo terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Promo
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={4} columns={7} />
          ) : promos.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">sell</span>Belum ada promo</div>
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Min. Order</th><th>Masa Berlaku</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.code}</td>
                    <td><span className="badge gray">{p.type === 'PERCENT' ? 'Persen' : 'Nominal'}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.type === 'PERCENT' ? `${p.value}%` : fmt(p.value)}</td>
                    <td>{fmt(p.minOrder)}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {p.startAt ? new Date(p.startAt).toLocaleDateString('id-ID') : '∞'} - {p.endAt ? new Date(p.endAt).toLocaleDateString('id-ID') : '∞'}
                      </div>
                    </td>
                    <td><span className={`badge ${p.isActive ? 'green' : 'gray'}`}>{p.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <ActionMenu items={[
                        { icon: 'edit', label: 'Ubah Promo', onClick: () => openEdit(p) },
                        { icon: p.isActive ? 'visibility_off' : 'visibility', label: p.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => handleToggle(p) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>sell</span> {editingId ? 'Edit Promo' : 'Tambah Promo Baru'}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Kode Promo / Voucher</label>
                <input className="form-input" placeholder="CONTOH: HEMAT50" style={{ textTransform: 'uppercase' }} value={formCode} onChange={e => setFormCode(e.target.value)} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Tipe Potongan</label><CustomSelect value={promoType} onChange={setPromoType} options={[{ value: 'PERCENT', label: 'Persen (%)' }, { value: 'NOMINAL', label: 'Nominal (Rp)' }]} /></div>
                <div className="form-group"><label className="form-label">Nilai Potongan</label><input className="form-input" type="number" placeholder="10" value={formValue} onChange={e => setFormValue(e.target.value)} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Min. Belanja (Rp)</label><input className="form-input" type="number" placeholder="50000" value={formMinOrder} onChange={e => setFormMinOrder(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Maks. Potongan (Rp)</label><input className="form-input" type="number" placeholder="Opsional" value={formMaxDiscount} onChange={e => setFormMaxDiscount(e.target.value)} /></div>
              </div>

              <div style={{ borderTop: '1px solid #eee', pt: 16, mt: 8 }}>
                <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>Batas & Validitas</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Total Kuota (0=∞)</label><input className="form-input" type="number" placeholder="0" value={formLimit} onChange={e => setFormLimit(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Kuota per User</label><input className="form-input" type="number" placeholder="1" value={formPerUserLimit} onChange={e => setFormPerUserLimit(e.target.value)} /></div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '12px' }}>
                  <div className="form-group"><label className="form-label">Tgl Mulai</label><input className="form-input" type="date" value={formStartAt} onChange={e => setFormStartAt(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Tgl Berakhir</label><input className="form-input" type="date" value={formEndAt} onChange={e => setFormEndAt(e.target.value)} /></div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Metode Pembayaran yang Diizinkan</label>
                  <Select
                    isMulti
                    options={PAYMENT_METHODS}
                    value={PAYMENT_METHODS.filter(m => formAllowedPayments.includes(m.value))}
                    onChange={(selected) => setFormAllowedPayments((selected || []).map((s: any) => s.value))}
                    placeholder="Semua Metode Pembayaran (Pilih untuk membatasi)"
                    noOptionsMessage={() => 'Metode tidak ditemukan'}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    styles={selectStyles}
                  />
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                    * Biarkan kosong agar berlaku untuk semua metode pembayaran. Jika dipilih, voucher hanya bisa digunakan pada metode tersebut.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>Cakupan (Opsional)</h4>
                  <div className="form-group">
                    <label className="form-label">Batasi ke Kategori</label>
                    <Select
                      isMulti
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      value={categories.filter(c => formCategoryIds.includes(c.id)).map(c => ({ value: c.id, label: c.name }))}
                      onChange={(selected) => setFormCategoryIds((selected || []).map((s: any) => s.value))}
                      placeholder="Semua Kategori (Pilih untuk membatasi)"
                      noOptionsMessage={() => 'Kategori tidak ditemukan'}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      styles={selectStyles}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Batasi ke Produk</label>
                    <Select
                      isMulti
                      options={allProducts.map(p => ({ value: p.id, label: p.name }))}
                      value={allProducts.filter(p => formProductIds.includes(p.id)).map(p => ({ value: p.id, label: p.name }))}
                      onChange={(selected) => setFormProductIds((selected || []).map((s: any) => s.value))}
                      placeholder="Semua Produk (Pilih untuk membatasi)"
                      noOptionsMessage={() => 'Produk tidak ditemukan'}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      styles={selectStyles}
                    />
                    <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>*Hanya menampilkan 100 produk terbaru</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}><span className="material-symbols-outlined">save</span> {editingId ? 'Simpan Perubahan' : 'Simpan Promo'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
