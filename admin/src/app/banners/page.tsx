'use client';

import { useState } from 'react';

const mockBanners = [
  { id: '1', title: 'Gratis Ongkir', type: 'hero', active: true, link: 'promo/free-delivery' },
  { id: '2', title: 'Diskon 20% Sayuran', type: 'promo', active: true, link: 'category/sayuran' },
  { id: '3', title: 'Ramadan Special', type: 'promo', active: false, link: 'promo/ramadan' },
];

export default function BannersPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banner</h1>
          <p className="page-subtitle">Kelola banner promosi</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Tambah Banner</button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {mockBanners.map(b => (
            <div key={b.id} style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 1px 3px var(--shadow)' }}>
              <div style={{ height: 140, background: b.type === 'hero' ? 'linear-gradient(135deg, #2E7D32, #4CAF50)' : 'linear-gradient(135deg, #FF9800, #FFB74D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{b.title}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className={`badge ${b.type === 'hero' ? 'green' : 'orange'}`}>{b.type.toUpperCase()}</span>
                  <span className={`badge ${b.active ? 'green' : 'gray'}`}>{b.active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 12 }}>Link: {b.link}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Banner</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Judul</label><input className="form-input" placeholder="Judul banner" /></div>
              <div className="form-group"><label className="form-label">Tipe</label><select className="form-select"><option>hero</option><option>promo</option></select></div>
              <div className="form-group"><label className="form-label">Link / Action</label><input className="form-input" placeholder="category/sayuran" /></div>
              <div className="form-group"><label className="form-label">Upload Gambar</label><div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: 32, textAlign: 'center', color: 'var(--text-hint)' }}>📷 Drag & drop atau klik untuk upload</div></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
