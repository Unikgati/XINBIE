'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';

const mockBroadcasts = [
  { id: '1', title: 'Promo Akhir Pekan', body: 'Diskon 20% untuk semua produk segar! Berlaku sampai Minggu.', target: 'Semua User', recipients: 1250, status: 'sent', createdAt: '2026-04-19T14:00:00' },
  { id: '2', title: 'Driver Meeting', body: 'Rapat koordinasi driver Sabtu 20 April pukul 09:00 di kantor.', target: 'Semua Driver', recipients: 12, status: 'sent', createdAt: '2026-04-18T09:00:00' },
  { id: '3', title: 'Maintenance Notice', body: 'Aplikasi akan maintenance pada 15 April pukul 22:00-24:00 WIB.', target: 'Semua', recipients: 1262, status: 'sent', createdAt: '2026-04-15T20:00:00' },
  { id: '4', title: 'Menu Baru Bulan Ini', body: 'Coba pilihan menu baru kami: Nasi Gudeg, Soto Betawi, dan Rawon.', target: 'Semua User', recipients: 1248, status: 'sent', createdAt: '2026-04-10T10:00:00' },
  { id: '5', title: 'Update Kebijakan Komisi', body: 'Mulai 1 Mei, komisi driver naik menjadi Rp 7.000 per order.', target: 'Semua Driver', recipients: 14, status: 'sent', createdAt: '2026-04-05T08:30:00' },
];

const targetLabels: Record<string, string> = {
  all: 'Semua Pengguna',
  all_users: 'Hanya User',
  all_drivers: 'Hanya Driver',
};

export default function BroadcastPage() {
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // TODO: Call POST /admin/broadcast
    setShowModal(false);
    setTitle('');
    setMessage('');
    setTarget('all');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Broadcast</h1>
          <p className="page-subtitle">{mockBroadcasts.length} broadcast terkirim</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">send</span> Kirim Broadcast
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Target</th>
                <th>Penerima</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {mockBroadcasts.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.body}</div>
                  </td>
                  <td>
                    <span className={`badge ${b.target === 'Semua Driver' ? 'blue' : b.target === 'Semua User' ? 'green' : 'gray'}`}>
                      {b.target}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.recipients.toLocaleString('id-ID')}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className="badge green">
                      <span className="material-symbols-outlined">check_circle</span> Terkirim
                    </span>
                  </td>
                  <td>
                    <ActionMenu items={[
                      { icon: 'visibility', label: 'Lihat Detail', onClick: () => {} },
                      { icon: 'content_copy', label: 'Kirim Ulang', onClick: () => {} },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kirim Broadcast */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>campaign</span> Kirim Broadcast</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Target Penerima</label>
                <CustomSelect
                  value={target}
                  onChange={setTarget}
                  options={[
                    { value: 'all', label: 'Semua Pengguna' },
                    { value: 'all_users', label: 'Hanya User (Pelanggan)' },
                    { value: 'all_drivers', label: 'Hanya Driver' },
                  ]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Judul Notifikasi</label>
                <input className="form-input" placeholder="Masukkan judul" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Isi Pesan</label>
                <textarea className="form-input" rows={4} placeholder="Tulis pesan broadcast..." value={message} onChange={e => setMessage(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ padding: 12, background: 'var(--primary-surface)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--primary-dark)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>info</span>
                Notifikasi akan dikirim ke semua perangkat {targetLabels[target]?.toLowerCase() || 'pengguna'} yang terdaftar.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSend} disabled={!title.trim() || !message.trim()}>
                <span className="material-symbols-outlined">send</span> Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
