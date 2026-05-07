'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import RichTextEditor from '@/components/RichTextEditor';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

const NUTRITION_TAGS = [
  // Vitamin (Tinggi vs Sumber)
  'Tinggi Vitamin A', 'Sumber Vitamin A',
  'Tinggi Vitamin B Kompleks', 'Sumber Vitamin B Kompleks', 'Sumber Vitamin B6', 'Mengandung Folat',
  'Tinggi Vitamin C', 'Sumber Vitamin C',
  'Tinggi Vitamin D', 'Sumber Vitamin D',
  'Tinggi Vitamin E', 'Sumber Vitamin E',
  'Tinggi Vitamin K', 'Sumber Vitamin K',
  'Sumber Beta Karoten',
  // Mineral
  'Tinggi Kalsium', 'Sumber Kalsium',
  'Tinggi Zat Besi', 'Sumber Zat Besi',
  'Tinggi Kalium', 'Sumber Kalium', 'Mengandung Kalium',
  'Tinggi Magnesium', 'Sumber Magnesium',
  // Makronutrien
  'Tinggi Serat', 'Sumber Serat',
  'Tinggi Protein', 'Sumber Protein',
  'Karbohidrat Kompleks',
  // Klaim Gizi
  'Rendah Gula', 'Rendah Kalori', 'Kaya Antioksidan', 'Sumber Antioksidan', 'Mengandung Likopen',
  'Bebas Kolesterol', 'Lemak Sehat (Omega-3)',
  // Gaya Hidup
  'Organik', 'Bebas Gluten', 'Bebas Pengawet', 'Tanpa Pemanis Buatan',
  'Vegan / Plant-based', '100% Alami',
  // Karakter Produk
  'Pedas', 'Penguat Rasa Alami',
  // Non-makanan
  'Anti Bakteri', 'Ramah Lingkungan', 'Lembut di Tangan', 'Food Grade',
];

const TAG_OPTIONS = NUTRITION_TAGS.map(t => ({ value: t, label: t }));

interface Variant {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  discountPrice?: number;
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
  images?: string[];
  tags?: string[];
  relatedProductIds?: string[];
  stockQty: number;
  isActive: boolean;
  isFeatured: boolean;
  isUnlimitedStock?: boolean;
  categoryId?: string;
  category: { id: string; name: string };
  variants: Variant[];
  cookingVideos?: { id: string; title: string }[];
}

interface CookingVideo {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const KITCHEN_UNITS = [
  'pcs', 'kg', 'gram', 'ikat', 'bungkus', 'pack', 'liter', 'ml', 
  'botol', 'renceng', 'butir', 'tray', 'siung', 'kotak', 'dus', 'sisir',
  'lembar', 'kaleng', 'box', 'papan', 'karton', 'cup',
  'gelas', 'galon', 'toples', 'pouch', 'jar', 'jerigen', 'karung'
];

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
  discountPrice: string;
  stockQty: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cookingVideos, setCookingVideos] = useState<CookingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);
  const [deletedVariants, setDeletedVariants] = useState<string[]>([]);
  const [productCategory, setProductCategory] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [formImages, setFormImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formRelatedProductIds, setFormRelatedProductIds] = useState<string[]>([]);
  const [formCookingVideoIds, setFormCookingVideoIds] = useState<string[]>([]);

  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, vidRes] = await Promise.all([
        apiGet<any>(`/products?limit=20&page=${page}`),
        apiGet<Category[]>('/categories'),
        apiGet<CookingVideo[]>('/cooking-videos'),
      ]);
      setProducts(prodRes?.data ? prodRes.data : Array.isArray(prodRes) ? prodRes : []);
      setTotalPages(prodRes?.meta?.totalPages || 1);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setCookingVideos(Array.isArray(vidRes) ? vidRes : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

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
    setFormVariants(prev => [...prev, { tempId: Date.now().toString(), name: '', price: '', costPrice: '', discountPrice: '', stockQty: '' }]);
  };

  const removeFormVariant = (tempId: string) => {
    if (tempId.includes('-')) {
      setDeletedVariants(prev => [...prev, tempId]);
    }
    setFormVariants(prev => prev.filter(v => v.tempId !== tempId));
  };

  const updateFormVariant = (tempId: string, field: keyof FormVariant, value: string) => {
    setFormVariants(prev => prev.map(v => v.tempId === tempId ? { ...v, [field]: value } : v));
  };

  const handleGenerateDesc = async () => {
    if (!formName) {
      toast.error('Masukkan nama produk terlebih dahulu');
      return;
    }
    try {
      setGeneratingDesc(true);
      const catName = categories.find(c => c.id === productCategory)?.name || '';
      const res = await apiPost<any>('/ai/generate-desc', { productName: formName, categoryName: catName });
      if (res && res.description) {
        setFormDesc(res.description);
        
        // Auto match AI suggested keywords to actual products
        if (res.relatedKeywords && res.relatedKeywords.length > 0) {
          const matches = products.filter(p => {
             const lowerName = p.name.toLowerCase();
             return res.relatedKeywords.some((kw: string) => lowerName.includes(kw.toLowerCase()));
          });
          if (matches.length > 0) {
            const newIds = matches.map(m => m.id);
            // Append without duplicating
            setFormRelatedProductIds(prev => Array.from(new Set([...prev, ...newIds])));
            toast.success(`Berhasil menemukan ${matches.length} produk pelengkap otomatis!`);
          }
        }
        
        toast.success('Deskripsi berhasil di-generate!');
        setGenerateSuccess(true);
        setTimeout(() => setGenerateSuccess(false), 2000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal generate AI');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName(''); setFormPrice(''); setFormCostPrice(''); setFormDiscountPrice('');
    setFormStock(''); setFormUnit(''); setFormDesc(''); setFormVariants([]);
    setDeletedVariants([]);
    setFormImages([]); setExistingImages([]); setFormTags([]); setFormRelatedProductIds([]);
    setFormCookingVideoIds([]);
    setProductCategory(categories[0]?.id || '');
  };

  const handleCloseModal = async () => {
    if (formName || formPrice || formImages.length > 0) {
      const ok = await confirm({
        title: 'Tutup Form?',
        message: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup form?',
        confirmLabel: 'Tutup',
        danger: true,
      });
      if (!ok) return;
    }
    setShowModal(false);
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
    setExistingImages(p.images || []);
    setFormTags(p.tags || []);
    setFormRelatedProductIds(p.relatedProductIds || []);
    setFormCookingVideoIds(p.cookingVideos ? p.cookingVideos.map(v => v.id) : []);
    setFormImages([]);
    setFormVariants(p.variants ? p.variants.map(v => ({
      tempId: v.id,
      name: v.name,
      price: String(v.price),
      costPrice: String(v.costPrice),
      discountPrice: v.discountPrice ? String(v.discountPrice) : '',
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
      formData.append('tags', JSON.stringify(formTags));
      formData.append('relatedProductIds', JSON.stringify(formRelatedProductIds));
      formData.append('cookingVideoIds', JSON.stringify(formCookingVideoIds));
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
      if (prodId) {
        // 1. Delete removed variants
        for (const delId of deletedVariants) {
          try {
            await apiDelete(`/variants/${delId}`);
          } catch (e) {
            console.error('Failed to delete variant', delId);
          }
        }

        // 2. Create or Update current variants
        for (const v of formVariants) {
          const varData = new FormData();
          varData.append('name', v.name);
          varData.append('price', v.price);
          varData.append('costPrice', v.costPrice || '0');
          if (v.discountPrice) varData.append('discountPrice', v.discountPrice);
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
            <span className="material-symbols-outlined search-icon">search</span>
            <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">inventory_2</span>
              {search ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
            </div>
          ) : (
            <div className="table-responsive">
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
                              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
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
                          {hasVariants ? (
                            <span className="badge gray">Bervariasi</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className={`badge ${marginColor(margin)}`}>{margin}%</span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({fmt(profit)})</span>
                            </div>
                          )}
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
                        const vSellPrice = v.discountPrice || v.price;
                        const vMargin = calcMargin(vSellPrice, v.costPrice);
                        const vProfit = vSellPrice - v.costPrice;
                        return (
                          <tr key={v.id} style={{ background: 'var(--primary-surface)' }}>
                            <td style={{ paddingLeft: hasVariants ? 72 : 48 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>subdirectory_arrow_right</span>
                                <span style={{ fontWeight: 500 }}>{v.name}</span>
                              </div>
                            </td>
                            <td></td>
                            <td>
                              {v.discountPrice ? (
                                <div>
                                  <div style={{ textDecoration: 'line-through', color: 'var(--text-hint)', fontSize: 12 }}>{fmt(v.price)}</div>
                                  <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{fmt(v.discountPrice)}</div>
                                </div>
                              ) : <div style={{ fontWeight: 600 }}>{fmt(v.price)}</div>}
                            </td>
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
            </div>
          )}

          {!loading && filtered.length > 0 && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{editingId ? 'edit' : 'add_shopping_cart'}</span> {editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button className="btn btn-outline btn-icon" onClick={handleCloseModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Foto Produk
                </label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {/* Existing images from server */}
                  {existingImages.map((url, idx) => (
                    <div key={`existing-${idx}`} style={{ 
                      width: 80, height: 80, borderRadius: 'var(--radius-md)', 
                      background: 'var(--divider)', position: 'relative', overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" 
                        onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </div>
                  ))}

                  {/* Newly uploaded images */}
                  {formImages.map((file, idx) => (
                    <div key={`new-${idx}`} style={{ 
                      width: 80, height: 80, borderRadius: 'var(--radius-md)', 
                      background: 'var(--divider)', position: 'relative', overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" 
                        onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </div>
                  ))}

                  {/* Upload button - always visible so user can add more */}
                  <label className="upload-tile hover-scale" style={{ 
                    width: 80, height: 80, borderRadius: 'var(--radius-md)', border: '2px dashed var(--divider)', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', color: 'var(--text-hint)', transition: 'all 0.2s',
                    background: 'var(--primary-surface)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, marginBottom: 4, color: 'var(--primary-light)' }}>add_photo_alternate</span>
                    <span style={{ fontSize: 10, fontWeight: 500 }}>{existingImages.length > 0 || formImages.length > 0 ? 'Ganti' : 'Upload'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={e => {
                        if (e.target.files?.length) {
                          setFormImages([e.target.files[0]]);
                          setExistingImages([]);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Nama Produk</label><input className="form-input" placeholder="Masukkan nama produk" value={formName} onChange={e => setFormName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Kategori</label>
                <CustomSelect
                  value={productCategory}
                  onChange={setProductCategory}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Pilih kategori"
                />
              </div>
              <div style={formVariants.length > 0 ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Harga Beli (Rp)
                      <div className="tooltip-wrapper">
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-hint)', cursor: 'help', pointerEvents: 'auto' }}>info</span>
                        <span className="tooltip-text">Harga beli hanya terlihat di admin panel. Tidak ditampilkan ke pelanggan.</span>
                      </div>
                    </label>
                    <input className="form-input" type="number" placeholder="HPP" value={formCostPrice} onChange={e => setFormCostPrice(e.target.value)} />
                  </div>
                  <div className="form-group"><label className="form-label">Harga Jual (Rp)</label><input className="form-input" type="number" placeholder="0" value={formPrice} onChange={e => setFormPrice(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Harga Diskon (Rp)</label><input className="form-input" type="number" placeholder="Opsional" value={formDiscountPrice} onChange={e => setFormDiscountPrice(e.target.value)} /></div>
                </div>
                {formVariants.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: -8, marginBottom: 12 }}>* Harga utama diabaikan karena produk memiliki varian.</div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Stok</label><input className="form-input" type="number" placeholder="0" value={formStock} onChange={e => setFormStock(e.target.value)} /></div>
                  <div className="form-group">
                    <label className="form-label">Satuan</label>
                    <CustomSelect
                      value={formUnit}
                      onChange={setFormUnit}
                      options={[
                        ...KITCHEN_UNITS.map(u => ({ value: u, label: u })),
                        ...(formUnit && !KITCHEN_UNITS.includes(formUnit) ? [{ value: formUnit, label: formUnit }] : [])
                      ]}
                      placeholder="Pilih satuan"
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Deskripsi</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateDesc}
                    disabled={generatingDesc || generateSuccess}
                    className="btn btn-outline btn-icon ai-generate-btn" 
                    title="Generate Deskripsi dengan AI"
                    style={{ borderRadius: 100, borderColor: generateSuccess ? 'var(--success)' : 'transparent', background: generateSuccess ? 'var(--success-surface)' : 'var(--surface)' }}
                  >
                    {generatingDesc ? (
                      <span className="spinner" style={{ width: 18, height: 18, borderBottomColor: 'var(--primary)' }}></span>
                    ) : generateSuccess ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--success)' }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined gradient-icon" style={{ fontSize: 20 }}>auto_awesome</span>
                    )}
                  </button>
                </div>
                <RichTextEditor 
                  value={formDesc} 
                  onChange={setFormDesc} 
                  placeholder={generatingDesc ? "Sedang di-generate oleh AI..." : "Deskripsi produk..."} 
                  loading={generatingDesc} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tag Nutrisi / Atribut</label>
                <Select
                  isMulti
                  options={TAG_OPTIONS}
                  value={formTags.map(t => ({ value: t, label: t }))}
                  onChange={(selected) => setFormTags((selected || []).map((s: any) => s.value))}
                  placeholder="Cari tag... (misal: Tinggi Vitamin C)"
                  noOptionsMessage={() => 'Tag tidak ditemukan'}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={{
                    control: (base: any) => ({ ...base, background: 'var(--surface)', borderColor: 'var(--divider)', borderRadius: 'var(--radius-md)', minHeight: 40, fontSize: 14 }),
                    menu: (base: any) => ({ ...base, background: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }),
                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                    option: (base: any, state: any) => ({ ...base, background: state.isFocused ? 'var(--primary-surface)' : 'transparent', color: 'var(--text-primary)', fontSize: 13 }),
                    multiValue: (base: any) => ({ ...base, background: 'var(--primary-surface)', borderRadius: 12 }),
                    multiValueLabel: (base: any) => ({ ...base, color: 'var(--primary-dark)', fontSize: 12, fontWeight: 500, padding: '2px 6px' }),
                    multiValueRemove: (base: any) => ({ ...base, color: 'var(--primary)', borderRadius: '0 12px 12px 0', ':hover': { background: 'var(--primary-light)', color: '#fff' } }),
                    input: (base: any) => ({ ...base, color: 'var(--text-primary)' }),
                    placeholder: (base: any) => ({ ...base, color: 'var(--text-hint)', fontSize: 13 }),
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Produk Pelengkap (Cross-Selling)</label>
                <Select
                  isMulti
                  options={products.filter(p => p.id !== editingId).map(p => ({ value: p.id, label: p.name }))}
                  value={products.filter(p => formRelatedProductIds.includes(p.id)).map(p => ({ value: p.id, label: p.name }))}
                  onChange={(selected) => setFormRelatedProductIds((selected || []).map((s: any) => s.value))}
                  placeholder="Cari produk pelengkap (misal: Mentega, Keju)"
                  noOptionsMessage={() => 'Produk tidak ditemukan'}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={{
                    control: (base: any) => ({ ...base, background: 'var(--surface)', borderColor: 'var(--divider)', borderRadius: 'var(--radius-md)', minHeight: 40, fontSize: 14 }),
                    menu: (base: any) => ({ ...base, background: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }),
                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                    option: (base: any, state: any) => ({ ...base, background: state.isFocused ? 'var(--primary-surface)' : 'transparent', color: 'var(--text-primary)', fontSize: 13 }),
                    multiValue: (base: any) => ({ ...base, background: 'var(--primary-surface)', borderRadius: 12 }),
                    multiValueLabel: (base: any) => ({ ...base, color: 'var(--primary-dark)', fontSize: 12, fontWeight: 500, padding: '2px 6px' }),
                    multiValueRemove: (base: any) => ({ ...base, color: 'var(--primary)', borderRadius: '0 12px 12px 0', ':hover': { background: 'var(--primary-light)', color: '#fff' } }),
                    input: (base: any) => ({ ...base, color: 'var(--text-primary)' }),
                    placeholder: (base: any) => ({ ...base, color: 'var(--text-hint)', fontSize: 13 }),
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Video Inspirasi Memasak</label>
                <Select
                  isMulti
                  options={cookingVideos.map(v => ({ value: v.id, label: v.title }))}
                  value={cookingVideos.filter(v => formCookingVideoIds.includes(v.id)).map(v => ({ value: v.id, label: v.title }))}
                  onChange={(selected) => setFormCookingVideoIds((selected || []).map((s: any) => s.value))}
                  placeholder="Pilih video inspirasi... (cth: Cara Tumis Bayam)"
                  noOptionsMessage={() => 'Video tidak ditemukan. Tambahkan dulu di menu Inspirasi Masak.'}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={{
                    control: (base: any) => ({ ...base, background: 'var(--surface)', borderColor: 'var(--divider)', borderRadius: 'var(--radius-md)', minHeight: 40, fontSize: 14 }),
                    menu: (base: any) => ({ ...base, background: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)' }),
                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                    option: (base: any, state: any) => ({ ...base, background: state.isFocused ? 'var(--primary-surface)' : 'transparent', color: 'var(--text-primary)', fontSize: 13 }),
                    multiValue: (base: any) => ({ ...base, background: 'var(--primary-surface)', borderRadius: 12 }),
                    multiValueLabel: (base: any) => ({ ...base, color: 'var(--primary-dark)', fontSize: 12, fontWeight: 500, padding: '2px 6px' }),
                    multiValueRemove: (base: any) => ({ ...base, color: 'var(--primary)', borderRadius: '0 12px 12px 0', ':hover': { background: 'var(--primary-light)', color: '#fff' } }),
                    input: (base: any) => ({ ...base, color: 'var(--text-primary)' }),
                    placeholder: (base: any) => ({ ...base, color: 'var(--text-hint)', fontSize: 13 }),
                  }}
                />
              </div>



              {/* Variant Section */}
              <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: -3 }}>tune</span>
                    Varian Produk ({formVariants.length})
                    <div className="tooltip-wrapper">
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-hint)', cursor: 'help' }}>info</span>
                      <span className="tooltip-text">Tambahkan varian jika produk memiliki pilihan ukuran, kemasan, atau tipe.</span>
                    </div>
                  </label>

                  <button className="btn btn-outline btn-sm" type="button" onClick={addFormVariant}>
                    <span className="material-symbols-outlined">add</span> Tambah Varian
                  </button>
                </div>

                {formVariants.length === 0 ? null : (
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Harga Beli</label>
                            <input className="form-input" type="number" placeholder="0" value={v.costPrice} onChange={e => updateFormVariant(v.tempId, 'costPrice', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Harga Jual</label>
                            <input className="form-input" type="number" placeholder="0" value={v.price} onChange={e => updateFormVariant(v.tempId, 'price', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 11 }}>Diskon</label>
                            <input className="form-input" type="number" placeholder="Opsional" value={v.discountPrice} onChange={e => updateFormVariant(v.tempId, 'discountPrice', e.target.value)} />
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
