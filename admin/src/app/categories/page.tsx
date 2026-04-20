'use client';

import { useState } from 'react';

const mockCategories = [
  { id: '1', name: 'Sayuran', icon: '🥬', products: 8, active: true },
  { id: '2', name: 'Buah-buahan', icon: '🍎', products: 6, active: true },
  { id: '3', name: 'Bumbu Dapur', icon: '🌶️', products: 5, active: true },
  { id: '4', name: 'Protein', icon: '🥩', products: 4, active: true },
  { id: '5', name: 'Bahan Pokok', icon: '🍚', products: 3, active: true },
  { id: '6', name: 'Minuman', icon: '🧃', products: 2, active: true },
  { id: '7', name: 'Snack Sehat', icon: '🍪', products: 2, active: true },
  { id: '8', name: 'Frozen', icon: '🧊', products: 2, active: true },
];

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="page-subtitle">{mockCategories.length} kategori</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Tambah Kategori</button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {mockCategories.map(c => (
            <div key={c.id} className="stat-card" style={{ cursor: 'pointer' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--primary-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.products} produk</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-outline btn-sm">✏️</button>
                <button className="btn btn-danger btn-sm">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Tambah Kategori</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input className="form-input" placeholder="Masukkan nama" />
              </div>
              <div className="form-group">
                <label className="form-label">Ikon (Emoji)</label>
                <input className="form-input" placeholder="🥬" />
              </div>
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
