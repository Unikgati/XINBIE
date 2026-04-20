export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview bisnis Dapur Gizi hari ini</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined">calendar_today</span> Hari Ini
          </button>
          <button className="btn btn-primary btn-sm">
            <span className="material-symbols-outlined">refresh</span> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><span className="material-symbols-outlined">payments</span></div>
            <div>
              <div className="stat-value">Rp 2.5jt</div>
              <div className="stat-label">Pendapatan Hari Ini</div>
              <div className="stat-change up"><span className="material-symbols-outlined">trending_up</span> 12% dari kemarin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><span className="material-symbols-outlined">shopping_bag</span></div>
            <div>
              <div className="stat-value">42</div>
              <div className="stat-label">Pesanan Hari Ini</div>
              <div className="stat-change up"><span className="material-symbols-outlined">trending_up</span> 8% dari kemarin</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><span className="material-symbols-outlined">group</span></div>
            <div>
              <div className="stat-value">1,250</div>
              <div className="stat-label">Total Pelanggan</div>
              <div className="stat-change up"><span className="material-symbols-outlined">person_add</span> +15 baru</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><span className="material-symbols-outlined">local_shipping</span></div>
            <div>
              <div className="stat-value">8</div>
              <div className="stat-label">Driver Online</div>
              <div className="stat-change" style={{ color: 'var(--text-hint)' }}>dari 12 total</div>
            </div>
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3 className="data-card-title">
              <span className="material-symbols-outlined">receipt_long</span> Pesanan Terbaru
            </h3>
            <button className="btn btn-outline btn-sm">Lihat Semua <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Kode</th><th>Pelanggan</th><th>Items</th><th>Total</th><th>Status</th><th>Waktu</th></tr>
            </thead>
            <tbody>
              {[
                { code: 'DG-260420-1234', name: 'Budi Santoso', items: 3, total: 'Rp 88.000', status: 'Diproses', badge: 'purple', icon: 'pending', time: '10:30' },
                { code: 'DG-260420-5678', name: 'Siti Rahayu', items: 5, total: 'Rp 150.000', status: 'Dikirim', badge: 'green', icon: 'local_shipping', time: '10:15' },
                { code: 'DG-260420-9012', name: 'Ahmad Pratama', items: 2, total: 'Rp 45.000', status: 'Menunggu', badge: 'orange', icon: 'schedule', time: '10:00' },
                { code: 'DG-260420-3456', name: 'Dewi Anggraeni', items: 1, total: 'Rp 85.000', status: 'Selesai', badge: 'green', icon: 'check_circle', time: '09:45' },
                { code: 'DG-260420-7890', name: 'Rina Wijaya', items: 4, total: 'Rp 120.000', status: 'Dibatalkan', badge: 'red', icon: 'cancel', time: '09:30' },
              ].map((o) => (
                <tr key={o.code}>
                  <td style={{ fontWeight: 600 }}>{o.code}</td>
                  <td>{o.name}</td>
                  <td>{o.items} item</td>
                  <td style={{ fontWeight: 600 }}>{o.total}</td>
                  <td><span className={`badge ${o.badge}`}><span className="material-symbols-outlined">{o.icon}</span> {o.status}</span></td>
                  <td style={{ color: 'var(--text-hint)' }}>{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: 'add_shopping_cart', label: 'Tambah Produk', bg: 'var(--success-surface)', color: 'var(--primary-dark)' },
            { icon: 'campaign', label: 'Kirim Broadcast', bg: 'var(--info-surface)', color: '#1D4ED8' },
            { icon: 'sell', label: 'Buat Promo', bg: 'var(--warning-surface)', color: '#B45309' },
            { icon: 'photo_library', label: 'Ubah Banner', bg: '#F3E8FF', color: '#7C3AED' },
          ].map((a) => (
            <div key={a.label} className="action-card">
              <div className="action-icon" style={{ background: a.bg }}>
                <span className="material-symbols-outlined" style={{ color: a.color }}>{a.icon}</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
