'use client';

import { useState } from 'react';

export default function BroadcastPage() {
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const history = [
    { id: '1', title: 'Promo Akhir Pekan 🎉', target: 'Semua User', sent: 1250, date: '19 Apr 2026 14:00' },
    { id: '2', title: 'Driver Meeting', target: 'Semua Driver', sent: 12, date: '18 Apr 2026 09:00' },
    { id: '3', title: 'Maintenance Notice', target: 'Semua', sent: 1262, date: '15 Apr 2026 20:00' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Broadcast</h1>
          <p className="page-subtitle">Kirim notifikasi ke pengguna</p>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Compose */}
          <div className="data-card">
            <div className="data-card-header"><h3 className="data-card-title">📝 Tulis Pesan</h3></div>
            <div style={{ padding: 20 }}>
              <div className="form-group">
                <label className="form-label">Target</label>
                <select className="form-select" value={target} onChange={e => setTarget(e.target.value)}>
                  <option value="all">Semua Pengguna</option>
                  <option value="users">Hanya User</option>
                  <option value="drivers">Hanya Driver</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Judul</label>
                <input className="form-input" placeholder="Judul notifikasi" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Pesan</label>
                <textarea className="form-input" rows={4} placeholder="Isi pesan broadcast..." value={message} onChange={e => setMessage(e.target.value)} />
              </div>

              {sent && <div className="alert success">✅ Broadcast berhasil dikirim!</div>}

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setSent(true); setTimeout(() => setSent(false), 3000); }}>
                📢 Kirim Broadcast
              </button>
            </div>
          </div>

          {/* History */}
          <div className="data-card">
            <div className="data-card-header"><h3 className="data-card-title">📋 Riwayat Broadcast</h3></div>
            <div style={{ padding: 20 }}>
              {history.map(h => (
                <div key={h.id} style={{ padding: 12, borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{h.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{h.target} • {h.sent} penerima</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{h.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
