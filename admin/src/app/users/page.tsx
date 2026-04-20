const mockUsers = [
  { id: '1', name: 'Budi Santoso', email: 'budi@email.com', phone: '0812-xxxx', orders: 15, total: 'Rp 1.2jt', joined: '1 Jan 2026', active: true },
  { id: '2', name: 'Siti Rahayu', email: 'siti@email.com', phone: '0813-xxxx', orders: 8, total: 'Rp 650K', joined: '15 Feb 2026', active: true },
  { id: '3', name: 'Ahmad Pratama', email: 'ahmad@email.com', phone: '0857-xxxx', orders: 3, total: 'Rp 180K', joined: '1 Mar 2026', active: true },
  { id: '4', name: 'Dewi Anggraeni', email: 'dewi@email.com', phone: '0821-xxxx', orders: 22, total: 'Rp 2.5jt', joined: '10 Dec 2025', active: true },
  { id: '5', name: 'Rina Wijaya', email: 'rina@email.com', phone: '0878-xxxx', orders: 0, total: 'Rp 0', joined: '18 Apr 2026', active: false },
];

export default function UsersPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelanggan</h1>
          <p className="page-subtitle">{mockUsers.length} pelanggan terdaftar</p>
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green">👥</div>
            <div><div className="stat-value">{mockUsers.length}</div><div className="stat-label">Total Pelanggan</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🛒</div>
            <div><div className="stat-value">{mockUsers.reduce((s, u) => s + u.orders, 0)}</div><div className="stat-label">Total Pesanan</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">⭐</div>
            <div><div className="stat-value">{mockUsers.filter(u => u.active).length}</div><div className="stat-label">Aktif</div></div>
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3 className="data-card-title">Daftar Pelanggan</h3>
            <div className="search-bar">
              <span>🔍</span>
              <input placeholder="Cari pelanggan..." />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Pelanggan</th><th>Kontak</th><th>Pesanan</th><th>Total Belanja</th><th>Bergabung</th><th>Status</th></tr>
            </thead>
            <tbody>
              {mockUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-circle">{u.name.split(' ').map(n => n[0]).join('')}</div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                    </div>
                  </td>
                  <td><div style={{ fontSize: 13 }}>{u.email}</div><div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{u.phone}</div></td>
                  <td>{u.orders}</td>
                  <td style={{ fontWeight: 600 }}>{u.total}</td>
                  <td style={{ color: 'var(--text-hint)', fontSize: 13 }}>{u.joined}</td>
                  <td><span className={`badge ${u.active ? 'green' : 'gray'}`}>{u.active ? 'Aktif' : 'Nonaktif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
