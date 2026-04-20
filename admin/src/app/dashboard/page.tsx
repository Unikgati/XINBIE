'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview bisnis Dapur Gizi bulan ini</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined">calendar_today</span> Bulan Ini
          </button>
          <button className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined">refresh</span> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Revenue & Profit Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><span className="material-symbols-outlined">payments</span></div>
            <div>
              <div className="stat-value">Rp 12.5jt</div>
              <div className="stat-label">Pendapatan Kotor</div>
              <div className="stat-change up"><span className="material-symbols-outlined">trending_up</span> 12% dari bulan lalu</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><span className="material-symbols-outlined">shopping_cart</span></div>
            <div>
              <div className="stat-value">Rp 8.2jt</div>
              <div className="stat-label">HPP (Harga Beli)</div>
              <div className="stat-change" style={{ color: 'var(--text-hint)' }}>Cost of Goods Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><span className="material-symbols-outlined">account_balance</span></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--primary-dark)' }}>Rp 4.3jt</div>
              <div className="stat-label">Laba Kotor</div>
              <div className="stat-change up"><span className="material-symbols-outlined">trending_up</span> 34% margin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><span className="material-symbols-outlined">percent</span></div>
            <div>
              <div className="stat-value">34%</div>
              <div className="stat-label">Margin Keuntungan</div>
              <div className="stat-change up"><span className="material-symbols-outlined">trending_up</span> +2% dari bulan lalu</div>
            </div>
          </div>
        </div>

        {/* Operational Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><span className="material-symbols-outlined">shopping_bag</span></div>
            <div>
              <div className="stat-value">42</div>
              <div className="stat-label">Pesanan Hari Ini</div>
              <div className="stat-change up"><span className="material-symbols-outlined">trending_up</span> 8% dari kemarin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><span className="material-symbols-outlined">group</span></div>
            <div>
              <div className="stat-value">1,250</div>
              <div className="stat-label">Total Pelanggan</div>
              <div className="stat-change up"><span className="material-symbols-outlined">person_add</span> +15 baru</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><span className="material-symbols-outlined">local_shipping</span></div>
            <div>
              <div className="stat-value">8 / 12</div>
              <div className="stat-label">Driver Online</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><span className="material-symbols-outlined">inventory_2</span></div>
            <div>
              <div className="stat-value">156</div>
              <div className="stat-label">Produk Aktif</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 className="data-card-title">
              <span className="material-symbols-outlined">receipt_long</span> Pesanan Terbaru
            </h3>
            <Link href="/orders" className="btn btn-outline btn-sm">Lihat Semua <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></Link>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Kode</th><th>Pelanggan</th><th>Items</th><th>Total</th><th>HPP</th><th>Profit</th><th>Status</th><th>Waktu</th></tr>
            </thead>
            <tbody>
              {[
                { code: 'DG-260420-1234', name: 'Budi Santoso', items: 3, total: 88000, cost: 58000, status: 'Diproses', badge: 'purple', icon: 'pending', time: '10:30' },
                { code: 'DG-260420-5678', name: 'Siti Rahayu', items: 5, total: 150000, cost: 95000, status: 'Dikirim', badge: 'green', icon: 'local_shipping', time: '10:15' },
                { code: 'DG-260420-9012', name: 'Ahmad Pratama', items: 2, total: 45000, cost: 28000, status: 'Menunggu', badge: 'orange', icon: 'schedule', time: '10:00' },
                { code: 'DG-260420-3456', name: 'Dewi Anggraeni', items: 1, total: 85000, cost: 55000, status: 'Selesai', badge: 'green', icon: 'check_circle', time: '09:45' },
                { code: 'DG-260420-7890', name: 'Rina Wijaya', items: 4, total: 120000, cost: 78000, status: 'Dibatalkan', badge: 'red', icon: 'cancel', time: '09:30' },
              ].map((o) => (
                <tr key={o.code}>
                  <td style={{ fontWeight: 600 }}>{o.code}</td>
                  <td>{o.name}</td>
                  <td>{o.items} item</td>
                  <td style={{ fontWeight: 600 }}>Rp {o.total.toLocaleString('id-ID')}</td>
                  <td style={{ color: 'var(--text-hint)', fontSize: 13 }}>Rp {o.cost.toLocaleString('id-ID')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Rp {(o.total - o.cost).toLocaleString('id-ID')}</td>
                  <td><span className={`badge ${o.badge}`}><span className="material-symbols-outlined">{o.icon}</span> {o.status}</span></td>
                  <td style={{ color: 'var(--text-hint)' }}>{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: 'add_shopping_cart', label: 'Tambah Produk', bg: 'var(--success-surface)', color: 'var(--primary-dark)', href: '/products' },
            { icon: 'campaign', label: 'Kirim Broadcast', bg: 'var(--info-surface)', color: '#1D4ED8', href: '/broadcast' },
            { icon: 'sell', label: 'Buat Promo', bg: 'var(--warning-surface)', color: '#B45309', href: '/promos' },
            { icon: 'photo_library', label: 'Ubah Banner', bg: '#F3E8FF', color: '#7C3AED', href: '/banners' },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="action-card">
              <div className="action-icon" style={{ background: a.bg }}>
                <span className="material-symbols-outlined" style={{ color: a.color }}>{a.icon}</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
