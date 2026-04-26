'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  type: string;
  actionType?: string;
  actionValue?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('PROMO');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<Banner[]>('/banners');
      setBanners(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat banner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !imageFile) { toast.error('Judul dan gambar wajib diisi'); return; }
    try {
      const fd = new FormData();
      fd.append('title', formTitle);
      fd.append('type', formType);
      fd.append('image', imageFile);
      await apiPost('/banners', fd);
      toast.success('Banner berhasil ditambahkan');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah banner');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({ title: 'Hapus Banner', message: `Hapus banner "${title}"?`, confirmLabel: 'Hapus', danger: true });
    if (!ok) return;
    try {
      await apiDelete(`/banners/${id}`);
      toast.success('Banner dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus');
    }
  };

  const openCreate = () => {
    setFormTitle(''); setFormType('PROMO'); setImageFile(null); setImagePreview('');
    setShowModal(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banner</h1>
          <p className="page-subtitle">{banners.length} banner aktif</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Banner
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : banners.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">image</span>Belum ada banner</div>
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Banner</th><th>Tipe</th><th>Status</th><th>Urutan</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {b.imageUrl && <img src={b.imageUrl} alt={b.title} style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 6 }} />}
                        <span style={{ fontWeight: 600 }}>{b.title}</span>
                      </div>
                    </td>
                    <td><span className="badge gray">{b.type}</span></td>
                    <td><span className={`badge ${b.isActive ? 'green' : 'gray'}`}>{b.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>{b.sortOrder}</td>
                    <td>
                      <ActionMenu items={[
                        { icon: 'delete', label: 'Hapus', onClick: () => handleDelete(b.id, b.title), danger: true },
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>image</span> Tambah Banner</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Judul</label><input className="form-input" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Judul banner" /></div>
              <div className="form-group">
                <label className="form-label">Gambar Banner</label>
                <FileUpload
                  accept="image/*"
                  icon="image"
                  label="Upload gambar banner"
                  hint="Format JPG, PNG, WebP — maks 2MB (Rekomendasi rasio 2.5:1, cth: 1000x400 px)"
                  maxSize={2048}
                  preview={imagePreview}
                  onChange={(file) => { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }}
                  onError={(msg) => toast.error(msg)}
                />
              </div>
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
