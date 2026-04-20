'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';

interface Variant {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stockQty: number;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  discountPrice?: number;
  stock: number;
  active: boolean;
  featured: boolean;
  variants: Variant[];
}

const mockProducts: Product[] = [
  { id: '1', name: 'Brokoli Segar', category: 'Sayuran', price: 15000, costPrice: 9000, stock: 50, active: true, featured: true, variants: [] },
  { id: '2', name: 'Apel Fuji', category: 'Buah', price: 35000, costPrice: 22000, discountPrice: 29000, stock: 30, active: true, featured: false, variants: [] },
  { id: '3', name: 'Telur Ayam', category: 'Protein', price: 28000, costPrice: 19000, stock: 200, active: true, featured: true, variants: [
    { id: 'v1', name: 'Kecil (10 pcs)', price: 18000, costPrice: 12000, stockQty: 80 },
    { id: 'v2', name: 'Sedang (10 pcs)', price: 22000, costPrice: 15000, stockQty: 70 },
    { id: 'v3', name: 'Besar (10 pcs)', price: 28000, costPrice: 19000, stockQty: 50 },
  ]},
  { id: '4', name: 'Beras Organik', category: 'Pokok', price: 85000, costPrice: 68000, stock: 100, active: true, featured: false, variants: [
    { id: 'v4', name: '1 kg', price: 18000, costPrice: 14000, stockQty: 50 },
    { id: 'v5', name: '5 kg', price: 85000, costPrice: 68000, stockQty: 30 },
    { id: 'v6', name: '25 kg', price: 395000, costPrice: 320000, stockQty: 20 },
  ]},
  { id: '5', name: 'Jahe Merah', category: 'Bumbu', price: 8000, costPrice: 4500, stock: 0, active: false, featured: false, variants: [] },
  { id: '6', name: 'Jus Cold Pressed', category: 'Minuman', price: 25000, costPrice: 12000, stock: 20, active: true, featured: false, variants: [] },
  { id: '7', name: 'Nugget Ayam', category: 'Frozen', price: 35000, costPrice: 20000, stock: 40, active: true, featured: true, variants: [
    { id: 'v7', name: '250g', price: 18000, costPrice: 10000, stockQty: 20 },
    { id: 'v8', name: '500g', price: 35000, costPrice: 20000, stockQty: 15 },
    { id: 'v9', name: '1 kg', price: 65000, costPrice: 38000, stockQty: 5 },
  ]},
  { id: '8', name: 'Keripik Tempe', category: 'Snack', price: 12000, costPrice: 6000, stock: 60, active: true, featured: false, variants: [] },
];

const categoryIcons: Record<string, string> = { Sayuran: 'grass', Buah: 'nutrition', Protein: 'egg_alt', Pokok: 'rice_bowl', Bumbu: 'local_fire_department', Minuman: 'local_cafe', Snack: 'cookie', Frozen: 'ac_unit' };
const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

function calcMargin(sell: number, cost: number) {
  if (cost <= 0 || sell <= 0) return 0;
  return Math.round(((sell - cost) / sell) * 100);
}

function marginColor(margin: number) {
  if (margin >= 40) return 'green';
  if (margin >= 20) return 'blue';
  if (margin >= 10) return 'orange';
  return 'red';
}

interface FormVariant {
  tempId: string;
  name: string;
  price: string;
  costPrice: string;
  stockQty: string;
}

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);
  const filtered = mockProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggleExpand = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addFormVariant = () => {
    setFormVariants(prev => [...prev, { tempId: Date.now().toString(), name: '', price: '', costPrice: '', stockQty: '' }]);
  };

  const removeFormVariant = (tempId: string) => {
    setFormVariants(prev => prev.filter(v => v.tempId !== tempId));
  };

  const updateFormVariant = (tempId: string, field: keyof FormVariant, value: string) => {
    setFormVariants(prev => prev.map(v => v.tempId === tempId ? { ...v, [field]: value } : v));
  };

  const openModal = () => {
    setFormVariants([]);
    setShowModal(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produk</h1>
          <p className="page-subtitle">{mockProducts.length} produk terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <span className="material-symbols-outlined">add</span> Tambah Produk
        </button>
      </div>
      <div className="page-body">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="data-card">
          <table className="data-table">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Harga Jual</th><th>Harga Beli</th><th>Margin</th><th>Stok</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const sellPrice = p.discountPrice || p.price;
                const margin = calcMargin(sellPrice, p.costPrice);
                const profit = sellPrice - p.costPrice;
                const hasVariants = p.variants.length > 0;
                const isExpanded = expandedProducts.has(p.id);
                return (
                  <>
                    <tr key={p.id} style={{ cursor: hasVariants ? 'pointer' : 'default' }} onClick={() => hasVariants && toggleExpand(p.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {hasVariants && (
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-hint)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>
                              chevron_right
                            </span>
                          )}
                          <div className="category-icon" style={{ width: 40, height: 40 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{categoryIcons[p.category] || 'inventory_2'}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {p.featured && <span className="badge green" style={{ fontSize: 10, padding: '2px 6px' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>star</span> Pilihan</span>}
                              {hasVariants && <span className="badge blue" style={{ fontSize: 10, padding: '2px 6px' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>tune</span> {p.variants.length} varian</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge gray">{p.category}</span></td>
                      <td>
                        {p.discountPrice ? (
                          <div>
                            <div style={{ textDecoration: 'line-through', color: 'var(--text-hint)', fontSize: 12 }}>{fmt(p.price)}</div>
                            <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{fmt(p.discountPrice)}</div>
                          </div>
                        ) : hasVariants ? (
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {fmt(Math.min(...p.variants.map(v => v.price)))} — {fmt(Math.max(...p.variants.map(v => v.price)))}
                          </div>
                        ) : <div style={{ fontWeight: 600 }}>{fmt(p.price)}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {hasVariants ? (
                          <span>{fmt(Math.min(...p.variants.map(v => v.costPrice)))} — {fmt(Math.max(...p.variants.map(v => v.costPrice)))}</span>
                        ) : fmt(p.costPrice)}
                      </td>
                      <td>
                        <div>
                          <span className={`badge ${marginColor(margin)}`}>{margin}%</span>
                          {!hasVariants && <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>+{fmt(profit)}</div>}
                        </div>
                      </td>
                      <td>
                        {hasVariants ? (
                          <span className="badge blue">
                            <span className="material-symbols-outlined">inventory</span> {p.variants.reduce((s, v) => s + v.stockQty, 0)} total
                          </span>
                        ) : (
                          <span className={`badge ${p.stock > 0 ? 'blue' : 'red'}`}>
                            <span className="material-symbols-outlined">{p.stock > 0 ? 'inventory' : 'inventory_2'}</span> {p.stock > 0 ? `${p.stock} pcs` : 'Habis'}
                          </span>
                        )}
                      </td>
                      <td><span className={`badge ${p.active ? 'green' : 'gray'}`}>{p.active ? 'Aktif' : 'Nonaktif'}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <ActionMenu items={[
                          { icon: 'edit', label: 'Edit Produk', onClick: () => {} },
                          ...(hasVariants ? [] : [{ icon: 'tune', label: 'Tambah Varian', onClick: () => {} }]),
                          { icon: 'star', label: p.featured ? 'Hapus Pilihan' : 'Jadikan Pilihan', onClick: () => {} },
                          { icon: 'visibility_off', label: p.active ? 'Nonaktifkan' : 'Aktifkan', onClick: () => {} },
                          { icon: 'delete', label: 'Hapus', onClick: () => {}, danger: true },
                        ]} />
                      </td>
                    </tr>
                    {/* Variant rows */}
                    {hasVariants && isExpanded && p.variants.map(v => {
                      const vMargin = calcMargin(v.price, v.costPrice);
                      const vProfit = v.price - v.costPrice;
                      return (
                        <tr key={v.id} style={{ background: 'var(--primary-surface)' }}>
                          <td style={{ paddingLeft: hasVariants ? 72 : 48 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>subdirectory_arrow_right</span>
                              <span style={{ fontWeight: 500 }}>{v.name}</span>
                            </div>
                          </td>
                          <td></td>
                          <td style={{ fontWeight: 600 }}>{fmt(v.price)}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{fmt(v.costPrice)}</td>
                          <td>
                            <span className={`badge ${marginColor(vMargin)}`}>{vMargin}%</span>
                            <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>+{fmt(vProfit)}</div>
                          </td>
                          <td><span className="badge blue">{v.stockQty} pcs</span></td>
                          <td></td>
                          <td onClick={e => e.stopPropagation()}>
                            <ActionMenu items={[
                              { icon: 'edit', label: 'Edit Varian', onClick: () => {} },
                              { icon: 'delete', label: 'Hapus Varian', onClick: () => {}, danger: true },
                            ]} />
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>add_shopping_cart</span> Tambah Produk</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nama Produk</label><input className="form-input" placeholder="Masukkan nama produk" /></div>
              <div className="form-group"><label className="form-label">Kategori</label><select className="form-select"><option>Sayuran</option><option>Buah</option><option>Bumbu</option><option>Protein</option><option>Pokok</option><option>Minuman</option><option>Snack</option><option>Frozen</option></select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Harga Beli (Rp)</label><input className="form-input" type="number" placeholder="HPP" /></div>
                <div className="form-group"><label className="form-label">Harga Jual (Rp)</label><input className="form-input" type="number" placeholder="0" /></div>
                <div className="form-group"><label className="form-label">Harga Diskon (Rp)</label><input className="form-input" type="number" placeholder="Opsional" /></div>
              </div>
              <div className="alert info" style={{ fontSize: 12 }}>
                <span className="material-symbols-outlined">info</span>
                Harga beli hanya terlihat di admin panel. Tidak ditampilkan ke pelanggan.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Stok</label><input className="form-input" type="number" placeholder="0" /></div>
                <div className="form-group"><label className="form-label">Satuan</label><input className="form-input" placeholder="pcs, kg, ikat..." /></div>
              </div>
              <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-input" rows={3} placeholder="Deskripsi produk..." /></div>
              <div className="form-group"><label className="form-label">Foto Produk</label><div className="upload-area"><span className="material-symbols-outlined">cloud_upload</span><div>Drag & drop atau klik untuk upload</div></div></div>

              {/* Variant Section */}
              <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: -3, marginRight: 4 }}>tune</span>
                    Varian Produk ({formVariants.length})
                  </label>
                  <button className="btn btn-outline btn-sm" type="button" onClick={addFormVariant}>
                    <span className="material-symbols-outlined">add</span> Tambah Varian
                  </button>
                </div>

                {formVariants.length === 0 ? (
                  <div className="alert info" style={{ fontSize: 12 }}>
                    <span className="material-symbols-outlined">info</span>
                    Tambahkan varian jika produk memiliki pilihan ukuran, kemasan, atau tipe. Contoh: Telur Kecil / Sedang / Besar.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {formVariants.map((v, idx) => (
                      <div key={v.tempId} style={{ padding: 14, background: 'var(--primary-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary-dark)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: -3 }}>subdirectory_arrow_right</span> Varian {idx + 1}
                          </span>
                          <button className="btn btn-outline btn-icon" type="button" onClick={() => removeFormVariant(v.tempId)} style={{ width: 28, height: 28, color: 'var(--error)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          </button>
                        </div>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                          <input className="form-input" placeholder="Nama varian (cth: Besar, 1kg, 500ml)" value={v.name} onChange={e => updateFormVariant(v.tempId, 'name', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Harga Jual</label>
                            <input className="form-input" type="number" placeholder="0" value={v.price} onChange={e => updateFormVariant(v.tempId, 'price', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Harga Beli</label>
                            <input className="form-input" type="number" placeholder="0" value={v.costPrice} onChange={e => updateFormVariant(v.tempId, 'costPrice', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Stok</label>
                            <input className="form-input" type="number" placeholder="0" value={v.stockQty} onChange={e => updateFormVariant(v.tempId, 'stockQty', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
