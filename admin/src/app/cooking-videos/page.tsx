'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Product {
  id: string;
  name: string;
}

interface CookingVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  products: Product[];
  createdAt: string;
}

export default function CookingVideosPage() {
  const [videos, setVideos] = useState<CookingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const vRes = await apiGet<CookingVideo[]>('/cooking-videos');
      setVideos(Array.isArray(vRes) ? vRes : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormTitle('');
    setFormUrl('');
    setEditId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (v: CookingVideo) => {
    setEditId(v.id);
    setFormTitle(v.title);
    setFormUrl(v.youtubeUrl);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formUrl.trim()) {
      toast.error('Judul dan URL video wajib diisi');
      return;
    }
    
    // Robust YouTube URL validation
    if (!getYoutubeId(formUrl)) {
      toast.error('URL harus berupa link YouTube valid');
      return;
    }

    try {
      const payload = {
        title: formTitle,
        videoUrl: formUrl,
      };

      if (editId) {
        await apiPut(`/cooking-videos/${editId}`, payload);
        toast.success('Video diperbarui');
      } else {
        await apiPost('/cooking-videos', payload);
        toast.success('Video ditambahkan');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan video');
    }
  };

  const handleDelete = async (v: CookingVideo) => {
    const ok = await confirm({
      title: 'Hapus Video?',
      message: `Yakin ingin menghapus video "${v.title}"?`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;

    try {
      await apiDelete(`/cooking-videos/${v.id}`);
      toast.success('Video dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus video');
    }
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inspirasi Masak</h1>
          <p className="page-subtitle">{videos.length} video inspirasi terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Video
        </button>
      </div>

      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">movie</span>
              Belum ada video inspirasi. Tambahkan video YouTube untuk menginspirasi pelanggan!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Judul</th>
                    <th>Produk Terkait</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((v) => {
                    const ytId = getYoutubeId(v.youtubeUrl);
                    const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                    
                    return (
                      <tr key={v.id}>
                        <td style={{ width: 120 }}>
                          <div style={{ 
                            width: 100, height: 60, borderRadius: 8, overflow: 'hidden', 
                            background: 'var(--divider)', position: 'relative'
                          }}>
                            {thumb ? (
                              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)' }}>play_circle</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{v.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                            <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span> Lihat di YouTube
                            </a>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {v.products.length > 0 ? (
                              v.products.map(p => (
                                <span key={p.id} className="badge gray" style={{ fontSize: 11 }}>{p.name}</span>
                              ))
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>Tidak ada produk terkait</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <ActionMenu items={[
                            { icon: 'edit', label: 'Edit', onClick: () => openEdit(v) },
                            { icon: 'delete', label: 'Hapus', onClick: () => handleDelete(v), danger: true },
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>movie</span> {editId ? 'Edit' : 'Tambah'} Video Inspirasi</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul Video</label>
                <input 
                  className="form-input" 
                  placeholder="Contoh: Resep Tumis Bayam Bawang Putih" 
                  value={formTitle} 
                  onChange={e => setFormTitle(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">URL YouTube</label>
                <input 
                  className="form-input" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={formUrl} 
                  onChange={e => setFormUrl(e.target.value)} 
                />
                <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 4 }}>
                  Link bisa diambil dari browser atau menu Share di aplikasi YouTube.
                </p>
              </div>

              {getYoutubeId(formUrl) && (
                <div style={{ marginTop: 16 }}>
                  <label className="form-label">Preview Thumbnail</label>
                  <img 
                    src={`https://img.youtube.com/vi/${getYoutubeId(formUrl)}/hqdefault.jpg`} 
                    alt="Preview" 
                    style={{ width: '100%', borderRadius: 12, border: '1px solid var(--divider)' }} 
                  />
                </div>
              )}
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
