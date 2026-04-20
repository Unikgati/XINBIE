'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiGet, apiPost, apiPut } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  iconUrl?: string;
  bgColor: string;
  sortOrder: number;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#4CAF50');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<Category[]>('/categories');
      setCategories(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormName(''); setFormColor('#4CAF50'); setIconFile(null); setIconPreview(''); setEditId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormColor(cat.bgColor);
    setIconPreview(cat.iconUrl || '');
    setEditId(cat.id);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/svg+xml', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format file harus SVG, PNG, atau WebP');
      return;
    }
    if (file.size > 500000) {
      toast.error('Ukuran file maksimal 500KB');
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nama kategori wajib diisi'); return; }
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('bgColor', formColor);
      if (iconFile) formData.append('icon', iconFile);

      if (editId) {
        await apiPut(`/categories/${editId}`, formData);
        toast.success(`Kategori "${formName}" diperbarui`);
      } else {
        await apiPost('/categories', formData);
        toast.success(`Kategori "${formName}" ditambahkan`);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kategori');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="page-subtitle">{categories.length} kategori</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Kategori
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /> Memuat kategori...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">category</span>
              Belum ada kategori
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Kategori</th><th>Warna</th><th>Produk</th><th>Urutan</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="category-icon" style={{ width: 40, height: 40, background: c.bgColor }}>
                          {c.iconUrl ? (
                            <img src={c.iconUrl} alt={c.name} style={{ width: 24, height: 24 }} />
                          ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>category</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: c.bgColor }} />
                        <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{c.bgColor}</span>
                      </div>
                    </td>
                    <td>{c._count?.products || 0} produk</td>
                    <td>{c.sortOrder}</td>
                    <td>
                      <ActionMenu items={[
                        { icon: 'edit', label: 'Edit', onClick: () => openEdit(c) },
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>category</span> {editId ? 'Edit' : 'Tambah'} Kategori</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nama Kategori</label><input className="form-input" placeholder="Masukkan nama" value={formName} onChange={e => setFormName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Warna Background</label><input className="form-input" type="color" value={formColor} onChange={e => setFormColor(e.target.value)} style={{ height: 44, padding: 4 }} /></div>
              <div className="form-group">
                <label className="form-label">Ikon (SVG/PNG/WebP, maks 500KB)</label>
                {iconPreview && (
                  <div style={{ marginBottom: 8, padding: 12, background: formColor, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={iconPreview} alt="preview" style={{ width: 48, height: 48 }} />
                  </div>
                )}
                <input type="file" accept=".svg,.png,.webp" onChange={handleFileChange} className="form-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}><span className="material-symbols-outlined">save</span> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
