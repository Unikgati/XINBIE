'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPut, apiDelete } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
  product: Product;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<{data: Review[]}>('/reviews?limit=50');
      setReviews(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat ulasan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string, userName: string) => {
    try {
      await apiPut(`/reviews/${id}/approve`, {});
      toast.success(`Ulasan dari ${userName} berhasil disetujui`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyetujui ulasan');
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    const ok = await confirm({
      title: 'Hapus Ulasan',
      message: `Hapus ulasan dari "${userName}"? Ulasan yang dihapus tidak dapat dikembalikan.`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;

    try {
      await apiDelete(`/reviews/${id}`);
      toast.success('Ulasan berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus ulasan');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', color: '#f59e0b' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: i <= rating ? "'FILL' 1" : "'FILL' 0" }}>
            star
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Moderasi Ulasan</h1>
          <p className="page-subtitle">{reviews.length} ulasan terbaru</p>
        </div>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">reviews</span>
              Belum ada ulasan
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Produk</th>
                    <th>Rating</th>
                    <th>Komentar</th>
                    <th>Foto</th>
                    <th>Status</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} style={{ backgroundColor: r.isActive ? 'transparent' : '#fffaf0' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {!r.isActive && (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F44336', display: 'inline-block' }} title="Perlu Moderasi"></span>
                          )}
                          <div style={{ fontWeight: 600 }}>{r.userName}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
                          {new Date(r.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td>{r.product?.name}</td>
                      <td>{renderStars(r.rating)}</td>
                      <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={() => setSelectedReview(r)}>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          {r.comment || <em style={{color: '#aaa'}}>- Tanpa komentar -</em>}
                        </div>
                      </td>
                      <td>
                        {r.images && r.images.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {r.images.map((img, i) => (
                              <a href={img} target="_blank" rel="noreferrer" key={i}>
                                <img src={img} alt="review" loading="lazy" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span style={{color: '#aaa', fontSize: 12}}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${r.isActive ? 'green' : 'orange'}`}>
                          {r.isActive ? 'Publik' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <ActionMenu items={[
                          ...(r.isActive ? [] : [{ icon: 'check_circle', label: 'Approve Ulasan', onClick: () => handleApprove(r.id, r.userName) }]),
                          { icon: 'delete', label: 'Tolak / Hapus', onClick: () => handleDelete(r.id, r.userName), danger: true },
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

      {/* Detail Modal */}
      {selectedReview && (
        <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                  reviews
                </span>
                Detail Ulasan
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--text-hint)' }} onClick={() => setSelectedReview(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: 80 }}>User:</span>
                <span>{selectedReview.userName}</span>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: 80 }}>Produk:</span>
                <span>{selectedReview.product?.name}</span>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: 80 }}>Rating:</span>
                <span>{renderStars(selectedReview.rating)}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Komentar:</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedReview.comment || <em style={{color: '#aaa'}}>- Tanpa komentar -</em>}
                </p>
              </div>
              
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Foto:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedReview.images.map((img, i) => (
                      <a href={img} target="_blank" rel="noreferrer" key={i}>
                        <img src={img} alt="review" loading="lazy" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedReview(null)}>Tutup</button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  handleDelete(selectedReview.id, selectedReview.userName);
                  setSelectedReview(null);
                }}
              >
                Hapus
              </button>
              {!selectedReview.isActive && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    handleApprove(selectedReview.id, selectedReview.userName);
                    setSelectedReview(null);
                  }}
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
