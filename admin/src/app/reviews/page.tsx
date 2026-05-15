'use client';

import { useState, useEffect, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPut, apiDelete } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
}

interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string | null;
  images: string[];
  avatar?: string | null;
  isActive: boolean;
  createdAt: string;
  product: Product;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: search
      });
      const res = await apiGet<any>(`/reviews?${query.toString()}`);
      setReviews(res.data || []);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat ulasan');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewReview = () => fetchData(false);
      socket.on('review:new', handleNewReview);
      return () => socket.off('review:new', handleNewReview);
    }
  }, [fetchData]);

  const handleApprove = async (id: string, userName: string) => {
    try {
      await apiPut(`/reviews/${id}/approve`, {});
      toast.success(`Ulasan dari ${userName} disetujui`);
      fetchData(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyetujui');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Bulk Approve',
      message: `Setujui ${selectedIds.length} ulasan terpilih sekaligus?`,
      confirmLabel: 'Approve Semua',
    });
    if (!ok) return;

    try {
      await apiPut('/reviews/bulk-approve', { ids: selectedIds });
      toast.success(`${selectedIds.length} ulasan berhasil disetujui`);
      setSelectedIds([]);
      fetchData(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal melakukan bulk approve');
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    const ok = await confirm({
      title: 'Hapus Ulasan',
      message: `Hapus ulasan dari "${userName}"?`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;

    try {
      await apiDelete(`/reviews/${id}`);
      toast.success('Dihapus');
      fetchData(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal');
    }
  };

  const getAvatarUrl = useCallback((review: Review) => {
    const seed = review.avatar || encodeURIComponent(review.userName || 'User');
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
  }, []);

  const renderStars = (rating: number) => (
    <div style={{ display: 'flex', color: '#f59e0b' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: i <= rating ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </span>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        .skeleton-pulse { 
          background: #f1f5f9; 
          position: relative; 
          overflow: hidden; 
          border-radius: 8px;
        }
        .skeleton-pulse::after { 
          content: ""; 
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); 
          animation: pulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
        }
        @keyframes pulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        /* Custom Premium Checkbox */
        .custom-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          user-select: none;
        }
        .custom-checkbox.checked {
          background: #0f172a;
          border-color: #0f172a;
        }
        .custom-checkbox .material-symbols-outlined {
          font-size: 16px;
          color: white;
          display: none;
        }
        .custom-checkbox.checked .material-symbols-outlined {
          display: block;
        }
      `}</style>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className="page-title">Moderasi Ulasan</h1>
            <p className="page-subtitle">Manajemen ulasan pelanggan</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedIds.length > 0 && (
              <button className="btn btn-primary" onClick={handleBulkApprove} style={{ background: '#0f172a', animation: 'fadeIn 0.2s ease' }}>
                <span className="material-symbols-outlined">done_all</span> Approve & Publish ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <span className="material-symbols-outlined search-icon">search</span>
            <input placeholder="Cari user, komentar, atau produk..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <div 
                          className={`custom-checkbox ${selectedIds.length === reviews.filter(r => !r.isActive).length && reviews.filter(r => !r.isActive).length > 0 ? 'checked' : ''}`}
                          style={{ opacity: reviews.some(r => !r.isActive) ? 1 : 0.3, pointerEvents: reviews.some(r => !r.isActive) ? 'auto' : 'none' }}
                          onClick={() => {
                            const pendingReviews = reviews.filter(r => !r.isActive);
                            if (selectedIds.length === pendingReviews.length) setSelectedIds([]);
                            else setSelectedIds(pendingReviews.map(r => r.id));
                          }}
                        >
                          <span className="material-symbols-outlined">check</span>
                        </div>
                      </th>
                      <th>User</th>
                      <th>Produk</th>
                      <th>Rating</th>
                      <th>Komentar</th>
                      <th>Status</th>
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr><td colSpan={7} className="empty-state">Data tidak ditemukan</td></tr>
                    ) : (
                      reviews.map((r) => (
                        <tr key={r.id} style={{ backgroundColor: selectedIds.includes(r.id) ? '#f0f9ff' : (r.isActive ? 'transparent' : '#fffaf0') }}>
                          <td>
                            {!r.isActive ? (
                              <div className={`custom-checkbox ${selectedIds.includes(r.id) ? 'checked' : ''}`} onClick={() => {
                                if (selectedIds.includes(r.id)) setSelectedIds(prev => prev.filter(id => id !== r.id));
                                else setSelectedIds(prev => [...prev, r.id]);
                              }}>
                                <span className="material-symbols-outlined">check</span>
                              </div>
                            ) : (
                              <div className="custom-checkbox" style={{ opacity: 0.2, cursor: 'not-allowed', background: '#e2e8f0' }}>
                                <span className="material-symbols-outlined" style={{ display: 'block', color: '#64748b' }}>done_all</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden' }}>
                                <img src={getAvatarUrl(r)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${r.userName}`; }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{r.userName}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString('id-ID')}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, fontWeight: 500 }}>{r.product?.name}</td>
                          <td>{renderStars(r.rating)}</td>
                          <td style={{ maxWidth: 250, fontSize: 13, color: '#475569' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '-'}</div>
                          </td>
                          <td><span className={`badge ${r.isActive ? 'green' : 'orange'}`}>{r.isActive ? 'PUBLISHED' : 'PENDING'}</span></td>
                          <td>
                            <ActionMenu items={[
                              { label: 'Detail', icon: 'visibility', onClick: () => setSelectedReview(r) },
                              ...(!r.isActive ? [{ label: 'Approve', icon: 'check_circle', onClick: () => handleApprove(r.id, r.userName) }] : []),
                              { label: 'Hapus', icon: 'delete', danger: true, onClick: () => handleDelete(r.id, r.userName) },
                            ]} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                  <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>Halaman {page} dari {totalPages}</div>
                  <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedReview && (
        <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="modal-content" style={{ maxWidth: 700, padding: 0, borderRadius: 20, overflow: 'hidden', background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Detail Moderasi</h2>
               <button onClick={() => setSelectedReview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <img src={getAvatarUrl(selectedReview)} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
                <div>
                   <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedReview.userName}</h3>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{new Date(selectedReview.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }}></div>
                      {renderStars(selectedReview.rating)}
                   </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                   <span className={`badge ${selectedReview.isActive ? 'green' : 'orange'}`} style={{ padding: '8px 16px', fontWeight: 700 }}>{selectedReview.isActive ? 'PUBLISHED' : 'PENDING'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: 24, alignItems: 'center' }}>
                <div style={{ width: 80, height: 80, minWidth: 80, aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {selectedReview.product?.images?.[0] ? <img src={selectedReview.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="material-symbols-outlined">image</span>}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                   <h4 style={{ 
                     fontSize: 16, 
                     fontWeight: 700, 
                     margin: '0',
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden',
                     lineHeight: '1.4'
                   }}>
                     {selectedReview.product?.name}
                   </h4>
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Komentar Pembeli</div>
                <div style={{ background: '#f9fafb', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', fontSize: 15, color: '#334155', lineHeight: 1.6 }}>{selectedReview.comment || '-'}</div>
              </div>
              
              {selectedReview.images?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>Foto Dari Pembeli</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {selectedReview.images.map((img, i) => (
                      <div 
                        key={i} 
                        onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                        style={{ cursor: 'pointer', width: 100, height: 100, aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'white' }}>zoom_in</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ background: '#f8fafc', padding: '16px 24px', display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setSelectedReview(null)}>Tutup</button>
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-danger" onClick={() => { handleDelete(selectedReview.id, selectedReview.userName); setSelectedReview(null); }}>Hapus</button>
              {!selectedReview.isActive && (
                <button className="btn btn-primary" style={{ background: '#0f172a' }} onClick={() => { handleApprove(selectedReview.id, selectedReview.userName); setSelectedReview(null); }}>Approve & Publish</button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReview && selectedReview.images && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={selectedReview.images.map(img => ({ src: img }))}
        />
      )}
    </>
  );
}
