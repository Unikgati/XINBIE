export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview bisnis Dapur Gizi hari ini</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm">📅 Hari Ini</button>
          <button className="btn btn-primary btn-sm">🔄 Refresh</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green">💰</div>
            <div>
              <div className="stat-value">Rp 2.5jt</div>
              <div className="stat-label">Pendapatan Hari Ini</div>
              <div className="stat-change up">↑ 12% dari kemarin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">📦</div>
            <div>
              <div className="stat-value">42</div>
              <div className="stat-label">Pesanan Hari Ini</div>
              <div className="stat-change up">↑ 8% dari kemarin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">👥</div>
            <div>
              <div className="stat-value">1,250</div>
              <div className="stat-label">Total Pelanggan</div>
              <div className="stat-change up">+15 baru</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">🚗</div>
            <div>
              <div className="stat-value">8</div>
              <div className="stat-label">Driver Online</div>
              <div className="stat-change">dari 12 total</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 className="data-card-title">Pesanan Terbaru</h3>
            <button className="btn btn-outline btn-sm">Lihat Semua →</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Pelanggan</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: 'DG-260420-1234', name: 'Budi Santoso', items: 3, total: 'Rp 88.000', status: 'Diproses', badge: 'purple', time: '10:30' },
                { code: 'DG-260420-5678', name: 'Siti Rahayu', items: 5, total: 'Rp 150.000', status: 'Dikirim', badge: 'green', time: '10:15' },
                { code: 'DG-260420-9012', name: 'Ahmad Pratama', items: 2, total: 'Rp 45.000', status: 'Menunggu', badge: 'orange', time: '10:00' },
                { code: 'DG-260420-3456', name: 'Dewi Anggraeni', items: 1, total: 'Rp 85.000', status: 'Selesai', badge: 'green', time: '09:45' },
                { code: 'DG-260420-7890', name: 'Rina Wijaya', items: 4, total: 'Rp 120.000', status: 'Dibatalkan', badge: 'red', time: '09:30' },
              ].map((o) => (
                <tr key={o.code}>
                  <td style={{ fontWeight: 600 }}>{o.code}</td>
                  <td>{o.name}</td>
                  <td>{o.items} item</td>
                  <td style={{ fontWeight: 600 }}>{o.total}</td>
                  <td><span className={`badge ${o.badge}`}>{o.status}</span></td>
                  <td style={{ color: 'var(--text-hint)' }}>{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: '🛒', label: 'Tambah Produk', color: 'var(--primary-surface)' },
            { icon: '📢', label: 'Kirim Broadcast', color: '#E3F2FD' },
            { icon: '🏷️', label: 'Buat Promo', color: '#FFF3E0' },
            { icon: '🖼️', label: 'Ubah Banner', color: '#F3E5F5' },
          ].map((a) => (
            <div key={a.label} style={{
              background: 'var(--card)', borderRadius: 'var(--radius-md)', padding: 16,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              boxShadow: '0 1px 3px var(--shadow)', transition: 'transform 0.2s',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{a.icon}</div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
