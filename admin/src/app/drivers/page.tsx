'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';

const mockDrivers = [
  { id: '1', name: 'Driver Ahmad', email: 'ahmad@driver.com', phone: '0812-1234-5678', status: 'approved', rating: 4.8, orders: 120, online: true },
  { id: '2', name: 'Driver Budi', email: 'budi@driver.com', phone: '0813-2345-6789', status: 'approved', rating: 4.6, orders: 85, online: false },
  { id: '3', name: 'Driver Candra', email: 'candra@driver.com', phone: '0857-3456-7890', status: 'pending', rating: 0, orders: 0, online: false },
  { id: '4', name: 'Driver Deni', email: 'deni@driver.com', phone: '0878-4567-8901', status: 'rejected', rating: 0, orders: 0, online: false },
  { id: '5', name: 'Driver Eka', email: 'eka@driver.com', phone: '0856-5678-9012', status: 'approved', rating: 4.9, orders: 200, online: true },
];

const statusBadge: Record<string, { label: string; badge: string; icon: string }> = {
  approved: { label: 'Aktif', badge: 'green', icon: 'verified' },
  pending: { label: 'Menunggu', badge: 'orange', icon: 'hourglass_top' },
  rejected: { label: 'Ditolak', badge: 'red', icon: 'block' },
};

export default function DriversPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockDrivers : mockDrivers.filter(d => d.status === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver</h1>
          <p className="page-subtitle">{mockDrivers.length} driver terdaftar &bull; {mockDrivers.filter(d => d.online).length} online</p>
        </div>
      </div>
      <div className="page-body">
        <div className="chip-group">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'Semua' : statusBadge[s]?.label}
            </button>
          ))}
        </div>

        <div className="data-card">
          <table className="data-table">
            <thead><tr><th>Driver</th><th>Kontak</th><th>Rating</th><th>Pesanan</th><th>Online</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-circle">{d.name.split(' ')[1]?.[0] || 'D'}</div>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                    </div>
                  </td>
                  <td><div style={{ fontSize: 13 }}>{d.email}</div><div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{d.phone}</div></td>
                  <td>{d.rating > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined icon-filled" style={{ fontSize: 16, color: '#F59E0B' }}>star</span> {d.rating}</span> : '-'}</td>
                  <td>{d.orders}</td>
                  <td><span className={`online-dot ${d.online ? 'active' : 'inactive'}`} /> <span style={{ marginLeft: 6, fontSize: 13 }}>{d.online ? 'Online' : 'Offline'}</span></td>
                  <td><span className={`badge ${statusBadge[d.status]?.badge}`}><span className="material-symbols-outlined">{statusBadge[d.status]?.icon}</span> {statusBadge[d.status]?.label}</span></td>
                  <td>
                    <ActionMenu items={
                      d.status === 'pending' ? [
                        { icon: 'check_circle', label: 'Approve', onClick: () => {} },
                        { icon: 'cancel', label: 'Reject', onClick: () => {}, danger: true },
                        { icon: 'description', label: 'Lihat KTP', onClick: () => {} },
                      ] : [
                        { icon: 'person', label: 'Detail Driver', onClick: () => {} },
                        { icon: 'history', label: 'Riwayat Pesanan', onClick: () => {} },
                        { icon: 'chat', label: 'Hubungi via WA', onClick: () => {} },
                        { icon: 'block', label: 'Suspend', onClick: () => {}, danger: true },
                      ]
                    } />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
