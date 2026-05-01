'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { getSocket } from '@/lib/socket';
import { apiGet, apiPut } from '@/lib/api';

interface Driver {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoneWa: string;
  verificationStatus: string;
  ktpPhotoUrl?: string;
  rejectionReason?: string;
  ratingAvg: number;
  totalOrdersDone: number;
  isOnline: boolean;
  vehicleType?: string;
  vehiclePlate?: string;
}

const statusBadge: Record<string, { label: string; badge: string; icon: string }> = {
  APPROVED: { label: 'Aktif', badge: 'green', icon: 'verified' },
  PENDING: { label: 'Menunggu', badge: 'orange', icon: 'hourglass_top' },
  REJECTED: { label: 'Ditolak', badge: 'red', icon: 'block' },
};

import { useNotification } from '@/components/NotificationProvider';

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const toast = useToast();
  const confirm = useConfirm();
  const { decrementPendingDriversCount, socketStatus } = useNotification();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const statusParam = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await apiGet<Driver[]>(`/drivers${statusParam}`);
      setDrivers(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data driver');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh when new driver registers via WebSocket (debounced)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchData(false), 500);
    };

    socket.on('driver:new_pending', debouncedRefresh);
    socket.on('driver:status', debouncedRefresh);
    return () => {
      socket.off('driver:new_pending', debouncedRefresh);
      socket.off('driver:status', debouncedRefresh);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData, socketStatus]);

  const handleVerify = async (e: React.MouseEvent, id: string, status: 'APPROVED' | 'REJECTED', name: string) => {
    e.stopPropagation();
    const isApprove = status === 'APPROVED';
    let rejectionReason = '';

    if (!isApprove) {
      const reason = window.prompt(`Alasan menolak "${name}":`);
      if (reason === null) return; // cancelled
      rejectionReason = reason;
    }

    const ok = await confirm({
      title: isApprove ? 'Approve Driver' : 'Reject Driver',
      message: isApprove
        ? `Setujui "${name}" sebagai driver aktif?`
        : `Tolak pendaftaran "${name}"?\nAlasan: ${rejectionReason || '(tidak ada)'}`,
      confirmLabel: isApprove ? 'Approve' : 'Reject',
      danger: !isApprove,
    });
    if (!ok) return;
    try {
      await apiPut(`/drivers/${id}/verify`, { status, rejectionReason });
      toast.success(`Driver "${name}" ${isApprove ? 'disetujui' : 'ditolak'}`);
      const driver = drivers.find(d => d.id === id);
      if (driver?.verificationStatus === 'PENDING') {
        decrementPendingDriversCount();
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses');
    }
  };

  const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    if (phone) window.open(`https://wa.me/${phone.replace(/^0/, '62')}`, '_blank');
  };

  const onlineCount = drivers.filter(d => d.isOnline).length;
  const pendingCount = drivers.filter(d => d.verificationStatus === 'PENDING').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver</h1>
          <p className="page-subtitle">
            {drivers.length} driver terdaftar &bull; {onlineCount} online
            {pendingCount > 0 && <span style={{ color: 'var(--orange)', fontWeight: 600 }}> &bull; {pendingCount} menunggu verifikasi</span>}
          </p>
        </div>
      </div>
      <div className="page-body">
        <div className="chip-group">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'Semua' : statusBadge[s]?.label || s}
              {s === 'PENDING' && pendingCount > 0 && (
                <span style={{
                  background: 'var(--orange)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 11,
                  marginLeft: 6,
                  fontWeight: 700,
                }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : drivers.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">directions_car</span>
              Belum ada driver terdaftar
            </div>
          ) : (
            <div className="table-responsive">
            <table className="data-table table-hover">
              <thead><tr><th>Driver</th><th>Kontak</th><th>Rating</th><th>Pesanan</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {drivers.map(d => {
                  const sb = statusBadge[d.verificationStatus] || { label: d.verificationStatus, badge: 'gray', icon: 'help' };
                  const isPending = d.verificationStatus === 'PENDING';
                  return (
                    <tr 
                      key={d.id} 
                      onClick={() => router.push(`/drivers/${d.id}`)} 
                      style={{ cursor: 'pointer', fontWeight: isPending ? 600 : 'normal', background: isPending ? 'var(--primary-surface, #f0f7ff)' : undefined }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isPending && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary, #2563eb)', display: 'inline-block', flexShrink: 0 }} />}
                          <div style={{ position: 'relative', display: 'flex' }}>
                            <div className="avatar-circle">{d.userName?.[0] || 'D'}</div>
                            <span style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              backgroundColor: d.isOnline ? '#22C55E' : '#9CA3AF',
                              border: '2.5px solid white'
                            }} title={d.isOnline ? 'Online' : 'Offline'} />
                          </div>
                          <div>
                            <div style={{ fontWeight: isPending ? 700 : 600 }}>{d.userName}</div>
                            {d.vehicleType && <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{d.vehicleType} • {d.vehiclePlate}</div>}
                          </div>
                        </div>
                      </td>
                      <td><div style={{ fontSize: 13 }}>{d.userEmail}</div><div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{d.userPhoneWa}</div></td>
                      <td>{d.ratingAvg > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined icon-filled" style={{ fontSize: 16, color: '#F59E0B' }}>star</span> {d.ratingAvg.toFixed(1)}</span> : '-'}</td>
                      <td>{d.totalOrdersDone}</td>
                      <td><span className={`badge ${sb.badge}`}><span className="material-symbols-outlined">{sb.icon}</span> {sb.label}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <ActionMenu items={
                          d.verificationStatus === 'PENDING' && d.ktpPhotoUrl ? [
                            { icon: 'check_circle', label: 'Approve', onClick: (e) => handleVerify(e as any, d.id, 'APPROVED', d.userName) },
                            { icon: 'cancel', label: 'Reject', onClick: (e) => handleVerify(e as any, d.id, 'REJECTED', d.userName), danger: true },
                          ] : [
                            { icon: 'chat', label: 'Hubungi via WA', onClick: (e) => handleWhatsApp(e as any, d.userPhoneWa) },
                          ]
                        } />
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
    </>
  );
}
