'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiGet, apiPut } from '@/lib/api';

interface Driver {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoneWa: string;
  verificationStatus: string;
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

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED', name: string) => {
    const isApprove = status === 'APPROVED';
    const ok = await confirm({
      title: isApprove ? 'Approve Driver' : 'Reject Driver',
      message: isApprove ? `Setujui "${name}" sebagai driver aktif?` : `Tolak pendaftaran "${name}"? Berikan alasan penolakan jika perlu.`,
      confirmLabel: isApprove ? 'Approve' : 'Reject',
      danger: !isApprove,
    });
    if (!ok) return;
    try {
      await apiPut(`/drivers/${id}/verify`, { status });
      toast.success(`Driver "${name}" ${isApprove ? 'disetujui' : 'ditolak'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses');
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (phone) window.open(`https://wa.me/${phone.replace(/^0/, '62')}`, '_blank');
  };

  const onlineCount = drivers.filter(d => d.isOnline).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver</h1>
          <p className="page-subtitle">{drivers.length} driver terdaftar &bull; {onlineCount} online</p>
        </div>
      </div>
      <div className="page-body">
        <div className="chip-group">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'Semua' : statusBadge[s]?.label || s}
            </button>
          ))}
        </div>

        <div className="data-card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /> Memuat data driver...</div>
          ) : drivers.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">directions_car</span>
              Belum ada driver terdaftar
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Driver</th><th>Kontak</th><th>Rating</th><th>Pesanan</th><th>Online</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {drivers.map(d => {
                  const sb = statusBadge[d.verificationStatus] || { label: d.verificationStatus, badge: 'gray', icon: 'help' };
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar-circle">{d.userName?.[0] || 'D'}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{d.userName}</div>
                            {d.vehicleType && <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{d.vehicleType} • {d.vehiclePlate}</div>}
                          </div>
                        </div>
                      </td>
                      <td><div style={{ fontSize: 13 }}>{d.userEmail}</div><div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{d.userPhoneWa}</div></td>
                      <td>{d.ratingAvg > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined icon-filled" style={{ fontSize: 16, color: '#F59E0B' }}>star</span> {d.ratingAvg.toFixed(1)}</span> : '-'}</td>
                      <td>{d.totalOrdersDone}</td>
                      <td><span className={`online-dot ${d.isOnline ? 'active' : 'inactive'}`} /> <span style={{ marginLeft: 6, fontSize: 13 }}>{d.isOnline ? 'Online' : 'Offline'}</span></td>
                      <td><span className={`badge ${sb.badge}`}><span className="material-symbols-outlined">{sb.icon}</span> {sb.label}</span></td>
                      <td>
                        <ActionMenu items={
                          d.verificationStatus === 'PENDING' ? [
                            { icon: 'check_circle', label: 'Approve', onClick: () => handleVerify(d.id, 'APPROVED', d.userName) },
                            { icon: 'cancel', label: 'Reject', onClick: () => handleVerify(d.id, 'REJECTED', d.userName), danger: true },
                          ] : [
                            { icon: 'chat', label: 'Hubungi via WA', onClick: () => handleWhatsApp(d.userPhoneWa) },
                          ]
                        } />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
