'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { getSocket } from '@/lib/socket';
import { apiGet, apiPut } from '@/lib/api';

interface DriverDetail {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoneWa: string;
  userAvatarUrl?: string;
  userIsActive: boolean;
  vehicleType?: string;
  vehiclePlate?: string;
  ktpPhotoUrl?: string;
  verificationStatus: string;
  rejectionReason?: string;
  ratingAvg: number;
  totalOrdersDone: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalOrders: number;
    lastOrderAt: string | null;
  };
  orders: any[]; // Similar to User orders
}

const statusBadge: Record<string, { label: string; badge: string; icon: string }> = {
  APPROVED: { label: 'Aktif', badge: 'green', icon: 'verified' },
  PENDING: { label: 'Menunggu', badge: 'orange', icon: 'hourglass_top' },
  REJECTED: { label: 'Ditolak', badge: 'red', icon: 'block' },
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const toWaLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '62')}`;

const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

import { useNotification } from '@/components/NotificationProvider';

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { decrementPendingDriversCount } = useNotification();
  const [data, setData] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<DriverDetail>(`/drivers/${params.id}`);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data driver');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { 
    fetchData(); 
    const socket = getSocket();
    if (!socket) return;
    
    const handleStatusUpdate = (updateData: any) => {
      if (updateData.driverId === data?.userId) {
        setData(prev => prev ? { ...prev, isOnline: updateData.isOnline } : prev);
      }
    };

    socket.on('driver:status', handleStatusUpdate);
    return () => {
      socket.off('driver:status', handleStatusUpdate);
    };
  }, [fetchData, data?.userId]);

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const QUICK_REASONS = [
    'Foto KTP tidak jelas / buram',
    'Foto KTP terpotong',
    'KTP tidak valid / sudah kadaluarsa',
    'Data tidak sesuai',
  ];

  const handleApprove = async () => {
    if (!data) return;
    const ok = await confirm({
      title: 'Approve Driver',
      message: `Setujui "${data.userName}" sebagai driver aktif?`,
      confirmLabel: 'Approve',
    });
    if (!ok) return;
    try {
      await apiPut(`/drivers/${data.id}/verify`, { status: 'APPROVED' });
      toast.success(`Driver "${data.userName}" disetujui`);
      if (data.verificationStatus === 'PENDING') decrementPendingDriversCount();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses');
    }
  };

  const handleRejectSubmit = async () => {
    if (!data || !rejectionReason.trim()) return;
    setSubmitting(true);
    try {
      await apiPut(`/drivers/${data.id}/verify`, { status: 'REJECTED', rejectionReason: rejectionReason.trim() });
      toast.success(`Driver "${data.userName}" ditolak`);
      if (data.verificationStatus === 'PENDING') decrementPendingDriversCount();
      setRejectModal(false);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUser = async () => {
    if (!data) return;
    const action = data.userIsActive ? 'Nonaktifkan' : 'Aktifkan';
    const ok = await confirm({
      title: `${action} Akun User`,
      message: `${action} akun "${data.userName}"?`,
      confirmLabel: action,
      danger: data.userIsActive,
    });
    if (!ok) return;
    try {
      await apiPut(`/users/${data.userId}/toggle`, {});
      toast.success(`Akun "${data.userName}" berhasil di${action.toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div>
              <div className="skeleton" style={{ width: 150, height: 24, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 4 }} />
            </div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
              <div className="data-card" style={{ padding: 24, display: 'flex', gap: 20 }}>
                <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 4, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: 150, height: 14, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
                </div>
              </div>
              <div className="data-card" style={{ padding: 20 }}>
                <TableSkeleton rows={5} columns={3} />
              </div>
            </div>
            <div className="data-card" style={{ padding: 20 }}>
               <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 20 }} />
               <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }} />
               <div style={{ display: 'flex', gap: 12 }}>
                 <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 8 }} />
                 <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 8 }} />
               </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-hint)' }}>search_off</span>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Driver tidak ditemukan</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => router.push('/drivers')}>
          <span className="material-symbols-outlined">arrow_back</span> Kembali
        </button>
      </div>
    );
  }

  const sb = statusBadge[data.verificationStatus] || { label: data.verificationStatus, badge: 'gray', icon: 'help' };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => router.push('/drivers')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="page-title">{data.userName}</h1>
            <p className="page-subtitle">{data.userEmail}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {data.userPhoneWa && (
            <a
              href={toWaLink(data.userPhoneWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ color: '#25D366', borderColor: '#25D366' }}
            >
              <WaIcon size={18} /> Chat WhatsApp
            </a>
          )}
          <button
            className={`btn ${data.userIsActive ? 'btn-outline' : 'btn-primary'}`}
            style={data.userIsActive ? { color: 'var(--error)', borderColor: 'var(--error)' } : {}}
            onClick={handleToggleUser}
          >
            <span className="material-symbols-outlined">{data.userIsActive ? 'person_off' : 'person'}</span>
            {data.userIsActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
          {/* Kiri: Profil & Statistik */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Kartu Profil Utama */}
            <div className="data-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--primary-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {data.userAvatarUrl ? (
                    <img src={data.userAvatarUrl} alt={data.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary)' }}>person</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{data.userName}</span>
                    <span className={`badge ${sb.badge}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{sb.icon}</span>
                      {sb.label}
                    </span>
                    <span className={`online-dot ${data.isOnline ? 'active' : 'inactive'}`} title={data.isOnline ? 'Online' : 'Offline'} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{data.userEmail}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>two_wheeler</span>
                      {data.vehicleType || '-'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>pin</span>
                      {data.vehiclePlate || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div style={{ display: 'flex', gap: 24, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4 }}>Rating</div>
                  <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: 18, color: '#F59E0B' }}>star</span>
                    {data.ratingAvg > 0 ? data.ratingAvg.toFixed(1) : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4 }}>Total Pesanan (Selesai)</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{data.totalOrdersDone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4 }}>Bergabung</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(data.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Riwayat Pesanan (Opsional, tapi bagus ada) */}
            <div className="data-card">
              <div className="data-card-header">
                <h3 className="data-card-title">Riwayat Pesanan (Driver)</h3>
              </div>
              {data.orders.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>Belum ada pesanan diantar</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Kode</th><th>Pelanggan</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.orders.map(o => (
                      <tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600 }}>{o.code}</td>
                        <td>{o.customerName}</td>
                        <td>{o.orderStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Kanan: KTP & Verifikasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="data-card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Verifikasi KTP</h3>
              
              {data.verificationStatus === 'REJECTED' && data.rejectionReason && (
                <div style={{
                  padding: '10px 14px', background: '#FEF2F2', borderRadius: 8,
                  fontSize: 13, color: '#DC2626', marginBottom: 16, border: '1px solid #FECACA',
                }}>
                  <strong>Alasan ditolak:</strong> {data.rejectionReason}
                </div>
              )}

              {data.ktpPhotoUrl ? (
                <div 
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    marginBottom: 16,
                    cursor: 'zoom-in',
                    aspectRatio: '1.58 / 1', // KTP Aspect Ratio
                  }}
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img
                    src={data.ktpPhotoUrl}
                    alt={`KTP ${data.userName}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.2s',
                      ...({ '&:hover': { transform: 'scale(1.02)' } } as any)
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  padding: 40, textAlign: 'center', background: 'var(--bg-subtle)',
                  borderRadius: 12, marginBottom: 16, color: 'var(--text-hint)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 8, display: 'block' }}>image_not_supported</span>
                  Belum upload KTP
                </div>
              )}

              {data.verificationStatus === 'PENDING' && data.ktpPhotoUrl && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={handleApprove}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => { setRejectionReason(''); setRejectModal(true); }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span> Reject
                  </button>
                </div>
              )}

              {data.verificationStatus === 'APPROVED' && (
                <div style={{ textAlign: 'center', padding: 12, background: '#F0FDF4', color: '#166534', borderRadius: 8, fontWeight: 600 }}>
                  Driver telah disetujui
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen KTP Lightbox */}
      {isLightboxOpen && data.ktpPhotoUrl && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: 40
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: 8, color: '#fff', display: 'flex' }}>
             <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </div>
          <img 
            src={data.ktpPhotoUrl} 
            alt={`KTP ${data.userName} Full`}
            style={{
              maxWidth: '100%', maxHeight: '100%',
              objectFit: 'contain',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              borderRadius: 8
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => !submitting && setRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>gpp_bad</span>
                Tolak Pendaftaran Driver
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
                Berikan alasan penolakan untuk <strong>{data?.userName}</strong>. Alasan ini akan ditampilkan kepada driver.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {QUICK_REASONS.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 20,
                      border: rejectionReason === reason ? '1.5px solid var(--error)' : '1px solid var(--border)',
                      background: rejectionReason === reason ? '#FEF2F2' : 'var(--bg)',
                      color: rejectionReason === reason ? 'var(--error)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Tulis alasan penolakan..."
                rows={3}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--error)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRejectModal(false)} disabled={submitting}>Batal</button>
              <button
                className="btn btn-danger"
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {submitting ? (
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
                )}
                {submitting ? 'Memproses...' : 'Tolak Driver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
