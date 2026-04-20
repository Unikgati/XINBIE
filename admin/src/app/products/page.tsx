'use client';

import { useState } from 'react';

const mockProducts = [
  { id: '1', name: 'Brokoli Segar', category: 'Sayuran', price: 15000, stock: 50, active: true, featured: true },
  { id: '2', name: 'Apel Fuji', category: 'Buah', price: 35000, discountPrice: 29000, stock: 30, active: true, featured: false },
  { id: '3', name: 'Dada Ayam Fillet', category: 'Protein', price: 45000, discountPrice: 39000, stock: 25, active: true, featured: true },
  { id: '4', name: 'Beras Organik 5kg', category: 'Pokok', price: 85000, stock: 100, active: true, featured: false },
  { id: '5', name: 'Jahe Merah', category: 'Bumbu', price: 8000, stock: 0, active: false, featured: false },
  { id: '6', name: 'Jus Cold Pressed', category: 'Minuman', price: 25000, stock: 20, active: true, featured: false },
  { id: '7', name: 'Nugget Ayam Homemade', category: 'Frozen', price: 35000, stock: 40, active: true, featured: true },
  { id: '8', name: 'Keripik Tempe', category: 'Snack', price: 12000, stock: 60, active: true, featured: false },
];

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = mockProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produk</h1>
          <p className="page-subtitle">{mockProducts.length} produk terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Tambah Produk</button>
      </div>
      <div className="page-body">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛒</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.featured && <span className="badge green" style={{ fontSize: 10 }}>⭐ Pilihan</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge gray">{p.category}</span></td>
                  <td>
                    {p.discountPrice ? (
                      <div>
                        <div style={{ textDecoration: 'line-through', color: 'var(--text-hint)', fontSize: 12 }}>{fmt(p.price)}</div>
                        <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{fmt(p.discountPrice)}</div>
                      </div>
                    ) : <div style={{ fontWeight: 600 }}>{fmt(p.price)}</div>}
                  </td>
                  <td>
                    <span className={`badge ${p.stock > 0 ? 'blue' : 'red'}`}>
                      {p.stock > 0 ? `${p.stock} pcs` : 'Habis'}
                    </span>
                  </td>
                  <td><span className={`badge ${p.active ? 'green' : 'gray'}`}>{p.active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline btn-sm">✏️</button>
                      <button className="btn btn-danger btn-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Produk</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input className="form-input" placeholder="Masukkan nama produk" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select">
                  <option>Sayuran</option><option>Buah</option><option>Bumbu</option>
                  <option>Protein</option><option>Pokok</option><option>Minuman</option>
                  <option>Snack</option><option>Frozen</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Harga (Rp)</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Diskon (Rp)</label>
                  <input className="form-input" type="number" placeholder="Opsional" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Stok</label>
                  <input className="form-input" type="number" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Satuan</label>
                  <input className="form-input" placeholder="pcs, kg, ikat..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={3} placeholder="Deskripsi produk..." />
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
