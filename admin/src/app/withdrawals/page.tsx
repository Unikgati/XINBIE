'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';

type WStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

const mockWithdrawals = [
  { id: '1', driverName: 'Budi Santoso', phone: '0812-1111-2222', amount: 125000, bank: 'BCA', accountNumber: '1234567890', accountHolder: 'Budi Santoso', status: 'PENDING' as WStatus, createdAt: '2026-04-20T10:30:00' },
  { id: '2', driverName: 'Andi Pratama', phone: '0812-3333-4444', amount: 85000, bank: 'GoPay', accountNumber: '08123334444', accountHolder: 'Andi Pratama', status: 'PENDING' as WStatus, createdAt: '2026-04-20T09:15:00' },
  { id: '3', driverName: 'Siti Rahayu', phone: '0812-5555-6666', amount: 200000, bank: 'Mandiri', accountNumber: '9876543210', accountHolder: 'Siti Rahayu', status: 'APPROVED' as WStatus, createdAt: '2026-04-19T14:00:00' },
  { id: '4', driverName: 'Rudi Hermawan', phone: '0812-7777-8888', amount: 150000, bank: 'OVO', accountNumber: '08127778888', accountHolder: 'Rudi Hermawan', status: 'COMPLETED' as WStatus, createdAt: '2026-04-18T11:30:00' },
  { id: '5', driverName: 'Dewi Lestari', phone: '0812-9999-0000', amount: 75000, bank: 'BRI', accountNumber: '5555666677', accountHolder: 'Dewi Lestari', status: 'REJECTED' as WStatus, createdAt: '2026-04-17T16:45:00' },
];

const statusConfig: Record<WStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Menunggu', color: 'orange', icon: 'hourglass_top' },
  APPROVED: { label: 'Disetujui', color: 'blue', icon: 'check_circle' },
  COMPLETED: { label: 'Selesai', color: 'green', icon: 'verified' },
  REJECTED: { label: 'Ditolak', color: 'red', icon: 'cancel' },
};

export default function WithdrawalsPage() {
  const [activeTab, setActiveTab] = useState<WStatus | 'ALL'>('ALL');
  const filtered = activeTab === 'ALL' ? mockWithdrawals : mockWithdrawals.filter(w => w.status === activeTab);

  const totalPending = mockWithdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + w.amount, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pencairan Saldo</h1>
          <p className="page-subtitle">{mockWithdrawals.filter(w => w.status === 'PENDING').length} permintaan menunggu • Total Rp {totalPending.toLocaleString('id-ID')}</p>
        </div>
      </div>
      <div className="page-body">
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {([
            { label: 'Menunggu', value: mockWithdrawals.filter(w => w.status === 'PENDING').length, icon: 'hourglass_top', color: '#F59E0B' },
            { label: 'Disetujui', value: mockWithdrawals.filter(w => w.status === 'APPROVED').length, icon: 'thumb_up', color: '#3B82F6' },
            { label: 'Selesai Bulan Ini', value: mockWithdrawals.filter(w => w.status === 'COMPLETED').length, icon: 'verified', color: 'var(--primary)' },
            { label: 'Ditolak', value: mockWithdrawals.filter(w => w.status === 'REJECTED').length, icon: 'block', color: 'var(--error)' },
          ]).map((c, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-card-icon" style={{ background: `${c.color}18`, color: c.color }}>
                <span className="material-symbols-outlined">{c.icon}</span>
              </div>
              <div className="stat-card-info">
                <div className="stat-card-value">{c.value}</div>
                <div className="stat-card-label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="data-card">
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--divider)', padding: '0 16px' }}>
            {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: activeTab === tab ? 600 : 400, fontSize: 13, fontFamily: 'inherit',
                  color: activeTab === tab ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'ALL' ? 'Semua' : statusConfig[tab].label}
                {tab === 'PENDING' && mockWithdrawals.filter(w => w.status === 'PENDING').length > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--error)', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 11 }}>
                    {mockWithdrawals.filter(w => w.status === 'PENDING').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Jumlah</th>
                  <th>Rekening Tujuan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => {
                  const sc = statusConfig[w.status];
                  return (
                    <tr key={w.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{w.driverName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{w.phone}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Rp {w.amount.toLocaleString('id-ID')}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{w.bank} • {w.accountNumber}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>a/n {w.accountHolder}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <span className={`badge ${sc.color}`}>
                          <span className="material-symbols-outlined">{sc.icon}</span> {sc.label}
                        </span>
                      </td>
                      <td>
                        <ActionMenu items={
                          w.status === 'PENDING' ? [
                            { icon: 'check_circle', label: 'Setujui & Transfer', onClick: () => {} },
                            { icon: 'cancel', label: 'Tolak', onClick: () => {}, danger: true },
                          ] : w.status === 'APPROVED' ? [
                            { icon: 'verified', label: 'Tandai Selesai', onClick: () => {} },
                            { icon: 'cancel', label: 'Tolak', onClick: () => {}, danger: true },
                          ] : [
                            { icon: 'visibility', label: 'Lihat Detail', onClick: () => {} },
                          ]
                        } />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
