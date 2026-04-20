'use client';

import { useState } from 'react';

const mockDrivers = [
  { id: '1', name: 'Driver Ahmad', email: 'ahmad@driver.com', phone: '0812-1234-5678', status: 'approved', rating: 4.8, orders: 120, online: true },
  { id: '2', name: 'Driver Budi', email: 'budi@driver.com', phone: '0813-2345-6789', status: 'approved', rating: 4.6, orders: 85, online: false },
  { id: '3', name: 'Driver Candra', email: 'candra@driver.com', phone: '0857-3456-7890', status: 'pending', rating: 0, orders: 0, online: false },
  { id: '4', name: 'Driver Deni', email: 'deni@driver.com', phone: '0878-4567-8901', status: 'rejected', rating: 0, orders: 0, online: false },
  { id: '5', name: 'Driver Eka', email: 'eka@driver.com', phone: '0856-5678-9012', status: 'approved', rating: 4.9, orders: 200, online: true },
];

const statusBadge: Record<string, { label: string; badge: string }> = {
  approved: { label: '✅ Aktif', badge: 'green' },
  pending: { label: '⏳ Menunggu', badge: 'orange' },
  rejected: { label: '❌ Ditolak', badge: 'red' },
};

export default function DriversPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockDrivers : mockDrivers.filter(d => d.status === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver</h1>
          <p className="page-subtitle">{mockDrivers.length} driver terdaftar • {mockDrivers.filter(d => d.online).length} online</p>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'Semua' : statusBadge[s]?.label}
            </button>
          ))}
        </div>

        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Kontak</th>
                <th>Rating</th>
                <th>Pesanan</th>
                <th>Online</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-circle">{d.name.split(' ')[1]?.[0] || 'D'}</div>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{d.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{d.phone}</div>
                  </td>
                  <td>{d.rating > 0 ? `⭐ ${d.rating}` : '-'}</td>
                  <td>{d.orders}</td>
                  <td>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.online ? 'var(--success)' : 'var(--text-hint)', display: 'inline-block' }} />
                    <span style={{ marginLeft: 6, fontSize: 13 }}>{d.online ? 'Online' : 'Offline'}</span>
                  </td>
                  <td><span className={`badge ${statusBadge[d.status]?.badge}`}>{statusBadge[d.status]?.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {d.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm">✅ Approve</button>
                          <button className="btn btn-danger btn-sm">❌ Reject</button>
                        </>
                      )}
                      {d.status === 'approved' && <button className="btn btn-outline btn-sm">📄 Detail</button>}
                    </div>
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
