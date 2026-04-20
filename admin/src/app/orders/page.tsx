'use client';

import { useState } from 'react';

const mockOrders = [
  { id: '1', code: 'DG-260420-1234', customer: 'Budi Santoso', phone: '0812-xxxx', items: 3, total: 88000, status: 'processing', payment: 'QRIS', driver: 'Driver A', date: '20 Apr 2026 10:30' },
  { id: '2', code: 'DG-260420-5678', customer: 'Siti Rahayu', phone: '0813-xxxx', items: 5, total: 150000, status: 'inDelivery', payment: 'COD', driver: 'Driver B', date: '20 Apr 2026 10:15' },
  { id: '3', code: 'DG-260420-9012', customer: 'Ahmad Pratama', phone: '0857-xxxx', items: 2, total: 45000, status: 'waitingPayment', payment: 'VA', driver: '-', date: '20 Apr 2026 10:00' },
  { id: '4', code: 'DG-260420-3456', customer: 'Dewi Anggraeni', phone: '0821-xxxx', items: 1, total: 85000, status: 'completed', payment: 'QRIS', driver: 'Driver C', date: '20 Apr 2026 09:45' },
  { id: '5', code: 'DG-260420-7890', customer: 'Rina Wijaya', phone: '0878-xxxx', items: 4, total: 120000, status: 'cancelled', payment: 'COD', driver: '-', date: '20 Apr 2026 09:30' },
  { id: '6', code: 'DG-260419-1111', customer: 'Hendra Gunawan', phone: '0856-xxxx', items: 6, total: 200000, status: 'completed', payment: 'QRIS', driver: 'Driver A', date: '19 Apr 2026 16:00' },
];

const statusMap: Record<string, { label: string; badge: string }> = {
  waitingPayment: { label: '🟡 Menunggu Bayar', badge: 'orange' },
  received: { label: '🔵 Diterima', badge: 'blue' },
  processing: { label: '🟣 Diproses', badge: 'purple' },
  waitingDriver: { label: '🟠 Tunggu Driver', badge: 'orange' },
  inDelivery: { label: '🚚 Dikirim', badge: 'green' },
  delivered: { label: '📦 Diantar', badge: 'green' },
  completed: { label: '✅ Selesai', badge: 'green' },
  cancelled: { label: '❌ Batal', badge: 'red' },
  problem: { label: '⚠️ Masalah', badge: 'orange' },
};

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockOrders : mockOrders.filter(o => o.status === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pesanan</h1>
          <p className="page-subtitle">{mockOrders.length} total pesanan</p>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'waitingPayment', 'processing', 'inDelivery', 'completed', 'cancelled'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(s)}>
              {s === 'all' ? 'Semua' : statusMap[s]?.label.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>

        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Pelanggan</th>
                <th>Items</th>
                <th>Total</th>
                <th>Pembayaran</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.code}</td>
                  <td>
                    <div>{o.customer}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{o.phone}</div>
                  </td>
                  <td>{o.items} item</td>
                  <td style={{ fontWeight: 600 }}>{fmt(o.total)}</td>
                  <td><span className="badge gray">{o.payment}</span></td>
                  <td>{o.driver}</td>
                  <td><span className={`badge ${statusMap[o.status]?.badge}`}>{statusMap[o.status]?.label}</span></td>
                  <td style={{ color: 'var(--text-hint)', fontSize: 13 }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
