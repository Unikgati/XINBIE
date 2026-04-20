'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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
  description?: string;
  price: number;
  costPrice: number;
  discountPrice?: number;
  discountPercent?: number;
  unit?: string;
  stockQty: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId?: string;
  category: { id: string; name: string };
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);
  const [productCategory, setProductCategory] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImages, setFormImages] = useState<File[]>([]);

  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        apiGet<any>('/products?limit=100'), // Explicitly pass 100 limit since pagination wrapper is used
        apiGet<Category[]>('/categories'),
      ]);
      setProducts(prodRes?.data ? prodRes.data : Array.isArray(prodRes) ? prodRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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

  const resetForm = () => {
    setEditingId(null);
    setFormName(''); setFormPrice(''); setFormCostPrice(''); setFormDiscountPrice('');
    setFormStock(''); setFormUnit(''); setFormDesc(''); setFormVariants([]);
    setFormImages([]);
    setProductCategory(categories[0]?.id || '');
  };

  const openModal = () => { resetForm(); setShowModal(true); };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormName(p.name);
    setProductCategory(p.categoryId || p.category?.id || categories[0]?.id || '');
    setFormPrice(String(p.price));
    setFormCostPrice(String(p.costPrice));
    setFormDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
    setFormStock(String(p.stockQty || 0));
    setFormUnit(p.unit || 'pcs');
    setFormDesc(p.description || '');
    setFormVariants(p.variants ? p.variants.map(v => ({
      tempId: v.id,
      name: v.name,
      price: String(v.price),
      costPrice: String(v.costPrice),
      stockQty: String(v.stockQty)
    })) : []);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formPrice) { toast.error('Nama dan harga wajib diisi'); return; }
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('categoryId', productCategory);
      formData.append('price', formPrice);
      formData.append('costPrice', formCostPrice || '0');
      if (formDiscountPrice) formData.append('discountPrice', formDiscountPrice);
      formData.append('stock', formStock || '0');
      formData.append('unit', formUnit || 'pcs');
      formData.append('description', formDesc);
      formImages.forEach(file => formData.append('images', file));
      
      let prodId = editingId;
      if (editingId) {
        await apiPut(`/products/${editingId}`, formData);
        toast.success('Produk berhasil diperbarui');
      } else {
        const prod = await apiPost<Product>('/products', formData);
        prodId = prod.id;
        toast.success('Produk berhasil ditambahkan');
      }

      // Handle variants mapping
      if (prodId && formVariants.length > 0) {
        for (const v of formVariants) {
          const varData = new FormData();
          varData.append('name', v.name);
          varData.append('price', v.price);
          varData.append('costPrice', v.costPrice || '0');
          varData.append('stockQty', v.stockQty || '0');

          if (v.tempId.includes('-')) {
            // It's a Prisma UUID, so update it
            await apiPut(`/variants/${v.tempId}`, varData);
          } else {
            // It's a new temp timestamp, create it
            await apiPost(`/products/${prodId}/variants`, varData);
          }
        }
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah produk');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Hapus Produk',
      message: `Hapus "${name}" beserta semua variannya? Aksi ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiDelete(`/products/${id}`);
      toast.success(`"${name}" berhasil dihapus`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus produk');
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const formData = new FormData();
      formData.append('isActive', String(!p.isActive));
      await apiPut(`/products/${p.id}`, formData);
      toast.success(`"${p.name}" ${p.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const handleToggleFeatured = async (p: Product) => {
    try {
      const formData = new FormData();
      formData.append('isFeatured', String(!p.isFeatured));
      await apiPut(`/products/${p.id}`, formData);
      toast.success(`"${p.name}" ${p.isFeatured ? 'dihapus dari' : 'dijadikan'} pilihan`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const handleDeleteVariant = async (variantId: string, variantName: string) => {
    const ok = await confirm({
      title: 'Hapus Varian',
      message: `Hapus varian "${variantName}"?`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiDelete(`/variants/${variantId}`);
      toast.success(`Varian "${variantName}" dihapus`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus varian');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produk</h1>
          <p className="page-subtitle">{products.length} produk terdaftar</p>
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
          {loading ? (
            <div className="loading-center"><div className="spinner" /> Memuat data produk...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">inventory_2</span>
              {search ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Produk</th><th>Kategori</th><th>Harga Jual</th><th>Harga Beli</th><th>Margin</th><th>Stok</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {filtered.map(p => {
                  const sellPrice = p.discountPrice || p.price;
                  const margin = calcMargin(sellPrice, p.costPrice || 0);
                  const profit = sellPrice - (p.costPrice || 0);
                  const hasVariants = p.variants && p.variants.length > 0;
                  const isExpanded = expandedProducts.has(p.id);
                  return (
                    <React.Fragment key={p.id}>
                      <tr style={{ cursor: hasVariants ? 'pointer' : 'default' }} onClick={() => hasVariants && toggleExpand(p.id)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {hasVariants && (
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-hint)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>
                                chevron_right
                              </span>
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {p.isFeatured && <span className="badge green" style={{ fontSize: 10, padding: '2px 6px' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>star</span> Pilihan</span>}
                                {hasVariants && <span className="badge blue" style={{ fontSize: 10, padding: '2px 6px' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>tune</span> {p.variants.length} varian</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge gray">{p.category?.name || '-'}</span></td>
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
                          ) : fmt(p.costPrice || 0)}
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
                            <span className={`badge ${(p.stockQty || 0) > 0 ? 'blue' : 'red'}`}>
                              <span className="material-symbols-outlined">{(p.stockQty || 0) > 0 ? 'inventory' : 'inventory_2'}</span> {(p.stockQty || 0) > 0 ? `${p.stockQty} pcs` : 'Habis'}
                            </span>
                          )}
                        </td>
                        <td><span className={`badge ${p.isActive ? 'green' : 'gray'}`}>{p.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <ActionMenu items={[
                            { icon: 'edit', label: 'Edit', onClick: () => openEdit(p) },
                            { icon: 'star', label: p.isFeatured ? 'Hapus Pilihan' : 'Jadikan Pilihan', onClick: () => handleToggleFeatured(p) },
                            { icon: 'visibility_off', label: p.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => handleToggleActive(p) },
                            { icon: 'delete', label: 'Hapus', onClick: () => handleDelete(p.id, p.name), danger: true },
                          ]} />
                        </td>
                      </tr>
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
                                { icon: 'delete', label: 'Hapus Varian', onClick: () => handleDeleteVariant(v.id, v.name), danger: true },
                              ]} />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{editingId ? 'edit' : 'add_shopping_cart'}</span> {editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nama Produk</label><input className="form-input" placeholder="Masukkan nama produk" value={formName} onChange={e => setFormName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Kategori</label>
                <CustomSelect
                  value={productCategory}
                  onChange={setProductCategory}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Pilih kategori"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Harga Beli (Rp)</label><input className="form-input" type="number" placeholder="HPP" value={formCostPrice} onChange={e => setFormCostPrice(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Harga Jual (Rp)</label><input className="form-input" type="number" placeholder="0" value={formPrice} onChange={e => setFormPrice(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Harga Diskon (Rp)</label><input className="form-input" type="number" placeholder="Opsional" value={formDiscountPrice} onChange={e => setFormDiscountPrice(e.target.value)} /></div>
              </div>
              <div className="alert info" style={{ fontSize: 12 }}>
                <span className="material-symbols-outlined">info</span>
                Harga beli hanya terlihat di admin panel. Tidak ditampilkan ke pelanggan.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Stok</label><input className="form-input" type="number" placeholder="0" value={formStock} onChange={e => setFormStock(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Satuan</label><input className="form-input" placeholder="pcs, kg, ikat..." value={formUnit} onChange={e => setFormUnit(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-input" rows={3} placeholder="Deskripsi produk..." value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>

              <div className="form-group">
                <label className="form-label">Foto Produk</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="form-input" 
                  onChange={e => setFormImages(Array.from(e.target.files || []))} 
                  style={{ padding: '8px' }} 
                />
                <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 4 }}>Bisa pilih lebih dari satu foto sekaligus.</div>
              </div>

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
                    Tambahkan varian jika produk memiliki pilihan ukuran, kemasan, atau tipe.
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
              <button className="btn btn-primary" onClick={handleSubmit}><span className="material-symbols-outlined">save</span> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
