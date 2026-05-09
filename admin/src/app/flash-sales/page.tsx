'use client';

import { useState, useEffect, useCallback } from 'react';
import Select, { components } from 'react-select';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface FlashSaleItem {
  id?: string;
  productId: string;
  flashPrice: number;
  flashStock: number;
  soldQty: number;
  limitPerUser: number;
  sortOrder: number;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stockQty: number;
  };
}

interface FlashSale {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  items: FlashSaleItem[];
  _count?: {
    items: number;
  };
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const selectStyles = {
  control: (base: any) => ({ ...base, background: 'var(--surface)', borderColor: 'var(--divider)', borderRadius: 'var(--radius-md)', minHeight: 40, fontSize: 14 }),
  menu: (base: any) => ({ ...base, background: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  option: (base: any, state: any) => ({ ...base, background: state.isFocused ? 'var(--primary-surface)' : 'transparent', color: 'var(--text-primary)', fontSize: 13 }),
  input: (base: any) => ({ ...base, color: 'var(--text-primary)' }),
  placeholder: (base: any) => ({ ...base, color: 'var(--text-hint)', fontSize: 13 }),
};

// Custom components for React-Select to show images
const CustomOption = (props: any) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 4, overflow: 'hidden', 
          background: 'var(--divider)', flexShrink: 0 
        }}>
          {data.image ? (
            <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>image</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>{data.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>Stok: {data.stock}</span>
        </div>
      </div>
    </components.Option>
  );
};

export default function FlashSalesPage() {
  const [sessions, setSessions] = useState<FlashSale[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formItems, setFormItems] = useState<Partial<FlashSaleItem>[]>([]);
  
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fsRes, prRes] = await Promise.all([
        apiGet<FlashSale[]>('/flash-sales'),
        apiGet<any>('/products?limit=200'),
      ]);
      setSessions(Array.isArray(fsRes) ? fsRes : []);
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
    setFormTitle('');
    setFormDesc('');
    setFormStartAt('');
    setFormEndAt('');
    setFormItems([]);
    setShowModal(true);
  };

  const openEdit = async (s: FlashSale) => {
    try {
      const detail = await apiGet<FlashSale>(`/flash-sales/${s.id}`);
      setEditingId(detail.id);
      setFormTitle(detail.title);
      setFormDesc(detail.description || '');
      setFormStartAt(new Date(detail.startAt).toISOString().slice(0, 16));
      setFormEndAt(new Date(detail.endAt).toISOString().slice(0, 16));
      setFormItems(detail.items.map(item => ({
        productId: item.productId,
        flashPrice: item.flashPrice,
        flashStock: item.flashStock,
        limitPerUser: item.limitPerUser,
        sortOrder: item.sortOrder
      })));
      setShowModal(true);
    } catch (err: any) {
      toast.error('Gagal memuat detail Flash Sale');
    }
  };

  const addItem = () => {
    setFormItems([...formItems, { productId: '', flashPrice: 0, flashStock: 10, limitPerUser: 1, sortOrder: formItems.length }]);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: keyof FlashSaleItem, value: any) => {
    const next = [...formItems];
    next[index] = { ...next[index], [key]: value };
    setFormItems(next);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formStartAt || !formEndAt) {
      toast.error('Judul dan waktu wajib diisi');
      return;
    }
    if (formItems.length === 0) {
      toast.error('Tambahkan setidaknya 1 produk');
      return;
    }

    try {
      const payload = {
        title: formTitle,
        description: formDesc,
        startAt: new Date(formStartAt).toISOString(),
        endAt: new Date(formEndAt).toISOString(),
        items: formItems.map(item => ({
          productId: item.productId,
          flashPrice: Number(item.flashPrice),
          flashStock: Number(item.flashStock),
          limitPerUser: Number(item.limitPerUser) || 1,
          sortOrder: Number(item.sortOrder) || 0
        }))
      };

      if (editingId) {
        await apiPut(`/flash-sales/${editingId}`, payload);
        toast.success('Flash Sale diperbarui');
      } else {
        await apiPost('/flash-sales', payload);
        toast.success('Flash Sale baru ditambahkan');
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan Flash Sale');
    }
  };

  const handleToggle = async (s: FlashSale) => {
    try {
      await apiPut(`/flash-sales/${s.id}`, { isActive: !s.isActive });
      toast.success(`Flash Sale ${s.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (s: FlashSale) => {
    const ok = await confirm({ 
      title: 'Hapus Flash Sale', 
      message: `Hapus sesi "${s.title}"? Tindakan ini tidak dapat dibatalkan.`, 
      confirmLabel: 'Hapus', 
      danger: true 
    });
    if (!ok) return;
    try {
      await apiDelete(`/flash-sales/${s.id}`);
      toast.success('Flash Sale berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus Flash Sale');
    }
  };

  const getStatus = (s: FlashSale) => {
    const now = new Date();
    const start = new Date(s.startAt);
    const end = new Date(s.endAt);
    if (!s.isActive) return { label: 'Nonaktif', color: 'gray' };
    if (now < start) return { label: 'Akan Datang', color: 'blue' };
    if (now > end) return { label: 'Berakhir', color: 'gray' };
    return { label: 'Berjalan', color: 'green' };
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Flash Sale</h1>
          <p className="page-subtitle">{sessions.length} sesi terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">bolt</span> Sesi Baru
        </button>
      </div>

      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={4} columns={6} />
          ) : sessions.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">bolt</span>Belum ada sesi Flash Sale</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sesi</th>
                    <th>Waktu Mulai</th>
                    <th>Waktu Berakhir</th>
                    <th>Produk</th>
                    <th>Status</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const status = getStatus(s);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.title}</td>
                        <td>{new Date(s.startAt).toLocaleString('id-ID')}</td>
                        <td>{new Date(s.endAt).toLocaleString('id-ID')}</td>
                        <td><span className="badge gray">{s._count?.items || 0} Produk</span></td>
                        <td><span className={`badge ${status.color}`}>{status.label}</span></td>
                        <td>
                          <ActionMenu items={[
                            { icon: 'edit', label: 'Ubah Sesi', onClick: () => openEdit(s) },
                            { icon: s.isActive ? 'visibility_off' : 'visibility', label: s.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => handleToggle(s) },
                            { icon: 'delete', label: 'Hapus', onClick: () => handleDelete(s), danger: true },
                          ]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>bolt</span> {editingId ? 'Edit Sesi Flash Sale' : 'Tambah Sesi Flash Sale'}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Judul Sesi</label>
                <input className="form-input" placeholder="Contoh: Flash Sale Spesial Ramadhan" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="form-label">Waktu Mulai</label><input className="form-input" type="datetime-local" value={formStartAt} onChange={e => setFormStartAt(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Waktu Berakhir</label><input className="form-input" type="datetime-local" value={formEndAt} onChange={e => setFormEndAt(e.target.value)} /></div>
              </div>

              <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Daftar Produk Flash Sale</h4>
                  <button className="btn btn-outline btn-sm" onClick={addItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Tambah Produk
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formItems.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1fr 80px 40px', 
                      gap: '12px', 
                      alignItems: 'end',
                      background: 'var(--surface-light)',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--divider)'
                    }}>
                      <div className="form-group">
                        <label className="form-label">Produk</label>
                        <Select
                          options={allProducts.map(p => ({ 
                            value: p.id, 
                            label: p.name,
                            image: p.images?.[0] || null,
                            stock: p.stockQty
                          }))}
                          value={allProducts
                            .filter(p => p.id === item.productId)
                            .map(p => ({ 
                              value: p.id, 
                              label: p.name,
                              image: p.images?.[0] || null,
                              stock: p.stockQty
                            }))[0]}
                          onChange={(val: any) => updateItem(idx, 'productId', val.value)}
                          styles={selectStyles}
                          placeholder="Pilih Produk"
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          components={{
                            Option: CustomOption
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Harga Flash (Rp)</label>
                        <input className="form-input" type="number" value={item.flashPrice} onChange={e => updateItem(idx, 'flashPrice', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Stok Promo</label>
                        <input className="form-input" type="number" value={item.flashStock} onChange={e => updateItem(idx, 'flashStock', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Limit</label>
                        <input className="form-input" type="number" value={item.limitPerUser} onChange={e => updateItem(idx, 'limitPerUser', e.target.value)} />
                      </div>
                      <button className="btn btn-icon" style={{ color: 'var(--error)', paddingBottom: '8px' }} onClick={() => removeItem(idx)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                  {formItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-hint)', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--divider)' }}>
                      Belum ada produk yang ditambahkan.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit}><span className="material-symbols-outlined">save</span> Simpan Sesi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
