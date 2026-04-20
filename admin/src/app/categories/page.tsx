'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';

const mockCategories = [
  { id: '1', name: 'Bahan Baku', icon: 'rice_bowl', products: 8 },
  { id: '2', name: 'Sayur & Buah', icon: 'nutrition', products: 6 },
  { id: '3', name: 'Snack & Roti', icon: 'cookie', products: 5 },
  { id: '4', name: 'Minuman', icon: 'local_cafe', products: 4 },
  { id: '5', name: 'Bumbu & Rempah', icon: 'local_fire_department', products: 3 },
  { id: '6', name: 'Kebersihan & Sanitasi', icon: 'cleaning_services', products: 2 },
  { id: '7', name: 'Telur & Daging', icon: 'egg_alt', products: 2 },
  { id: '8', name: 'Frozen Food', icon: 'ac_unit', products: 2 },
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">add</span> Tambah Kategori
        </button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {mockCategories.map(c => (
            <div key={c.id} className="category-card">
              <div className="category-icon">
                <span className="material-symbols-outlined">{c.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.products} produk</div>
              </div>
              <ActionMenu items={[
                { icon: 'edit', label: 'Edit Kategori', onClick: () => {} },
                { icon: 'visibility', label: 'Lihat Produk', onClick: () => {} },
                { icon: 'delete', label: 'Hapus', onClick: () => {}, danger: true },
              ]} />
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>category</span> Tambah Kategori</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nama Kategori</label><input className="form-input" placeholder="Masukkan nama" /></div>
              <div className="form-group"><label className="form-label">Ikon (Material Symbol)</label><input className="form-input" placeholder="rice_bowl" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">save</span> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
