'use client';

import React, { useState, useRef } from 'react';
import ActionMenu from '@/components/ActionMenu';

const mockCategories = [
  { id: '1', name: 'Bahan Baku', iconUrl: '/placeholder-category.png', products: 8 },
  { id: '2', name: 'Sayur & Buah', iconUrl: '/placeholder-category.png', products: 6 },
  { id: '3', name: 'Snack & Roti', iconUrl: '/placeholder-category.png', products: 5 },
  { id: '4', name: 'Minuman', iconUrl: '/placeholder-category.png', products: 4 },
  { id: '5', name: 'Bumbu & Rempah', iconUrl: '/placeholder-category.png', products: 3 },
  { id: '6', name: 'Kebersihan & Sanitasi', iconUrl: '/placeholder-category.png', products: 2 },
  { id: '7', name: 'Telur & Daging', iconUrl: '/placeholder-category.png', products: 2 },
  { id: '8', name: 'Frozen Food', iconUrl: '/placeholder-category.png', products: 2 },
];

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate: SVG, PNG, WebP only, max 500KB
    const validTypes = ['image/svg+xml', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format file harus SVG, PNG, atau WebP');
      return;
    }
    if (file.size > 500 * 1024) {
      alert('Ukuran file maksimal 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="page-subtitle">{mockCategories.length} kategori</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setIconPreview(null); }}>
          <span className="material-symbols-outlined">add</span> Tambah Kategori
        </button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {mockCategories.map(c => (
            <div key={c.id} className="category-card">
              <div className="category-icon" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.iconUrl ? (
                  <img src={c.iconUrl} alt={c.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                ) : (
                  <span className="material-symbols-outlined">category</span>
                )}
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

              {/* Icon Upload */}
              <div className="form-group">
                <label className="form-label">Ikon Kategori (SVG/PNG/WebP, maks 500KB)</label>
                <input type="file" ref={fileRef} accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" onChange={handleIconChange} style={{ display: 'none' }} />
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
                    padding: 20, textAlign: 'center', cursor: 'pointer',
                    background: iconPreview ? 'var(--surface)' : 'var(--background)',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {iconPreview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <img src={iconPreview} alt="Preview" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>Klik untuk ganti</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--text-hint)' }}>upload_file</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Upload ikon SVG/PNG</span>
                      <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>Rekomendasi: 128×128px, format SVG</span>
                    </div>
                  )}
                </div>
              </div>
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
