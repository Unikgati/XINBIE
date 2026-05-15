'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import RichTextEditor from '@/components/RichTextEditor';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';



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
  shopeeUrl?: string;
  ratingAvg?: number;
  sizes?: string[];
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

// Custom components for React-Select to show images
const CustomOption = (props: any) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 4, overflow: 'hidden', 
          background: 'var(--divider)', flexShrink: 0 
        }}>
          {data.image ? (
            <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>image</span>
            </div>
          )}
        </div>
        <span>{data.label}</span>
      </div>
    </components.Option>
  );
};

const CustomMultiValueLabel = (props: any) => {
  const { data } = props;
  return (
    <components.MultiValueLabel {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ 
          width: 20, height: 20, borderRadius: 3, overflow: 'hidden', 
          background: 'var(--divider)', flexShrink: 0 
        }}>
          {data.image ? (
            <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 10, color: 'var(--text-hint)' }}>image</span>
            </div>
          )}
        </div>
        <span>{props.children}</span>
      </div>
    </components.MultiValueLabel>
  );
};

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
  imageUrl?: string;
  file?: File;
}

const TagInput = ({ tags, setTags, placeholder }: { tags: string[], setTags: (t: string[]) => void, placeholder: string }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="form-input" style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 6, 
      minHeight: '42px', 
      height: 'auto', 
      padding: '8px 12px',
      alignItems: 'center'
    }}>
      {tags.map((tag, i) => (
        <span key={i} className="badge" style={{ 
          background: 'var(--primary-surface)', 
          color: 'var(--primary-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600
        }}>
          {tag}
          <span 
            className="material-symbols-outlined" 
            style={{ fontSize: 14, cursor: 'pointer', opacity: 0.7 }}
            onClick={() => removeTag(tag)}
          >
            close
          </span>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
          }
        }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{ 
          border: 'none', 
          outline: 'none', 
          background: 'transparent', 
          flex: 1,
          minWidth: 60,
          fontSize: 14,
          color: 'var(--text-primary)'
        }}
      />
    </div>
  );
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const [formDesc, setFormDesc] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [formImages, setFormImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formShopeeUrl, setFormShopeeUrl] = useState('');
  const [formRating, setFormRating] = useState('4.8');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState<string[]>([]);

  const sizeOptions = [
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
    { value: 'XXXL', label: 'XXXL' },
    { value: 'All Size', label: 'All Size' },
  ];

  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        apiGet<any>(`/products?limit=20&page=${page}`),
        apiGet<Category[]>('/categories'),
      ]);
      setProducts(prodRes?.data ? prodRes.data : Array.isArray(prodRes) ? prodRes : []);
      setTotalPages(prodRes?.meta?.totalPages || 1);
      setCategories(Array.isArray(catRes) ? catRes : []);
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
    setFormStock(''); setFormDesc(''); setFormVariants([]);
    setDeletedVariants([]);
    setFormImages([]); setExistingImages([]);
    setFormShopeeUrl('');
    setFormRating('4.8');
    setFormTags([]);
    setFormSizes([]);
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

    setFormDesc(p.description || '');
    setExistingImages(p.images || []);

    setFormShopeeUrl(p.shopeeUrl || '');
    setFormRating(String(p.ratingAvg || '4.8'));
    setFormTags(p.tags || []);
    setFormSizes(p.sizes || []);
    setFormImages([]);
    setFormVariants(p.variants ? p.variants.map(v => ({
      tempId: v.id,
      name: v.name,
      price: String(v.price),
      costPrice: String(v.costPrice),
      discountPrice: v.discountPrice ? String(v.discountPrice) : '',
      stockQty: String(v.stockQty),
      imageUrl: v.imageUrl
    })) : []);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formPrice) { toast.error('Nama dan harga wajib diisi'); return; }
    if (isSaving) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('categoryId', productCategory);
      formData.append('price', formPrice);
      formData.append('costPrice', formCostPrice || '0');
      if (formDiscountPrice) formData.append('discountPrice', formDiscountPrice);
      formData.append('stock', formStock || '0');

      formData.append('description', formDesc);
      formData.append('shopeeUrl', formShopeeUrl || '');
      formData.append('ratingAvg', formRating || '4.8');
      formTags.forEach(t => formData.append('tags', t));
      formSizes.forEach(s => formData.append('sizes', s));
      formImages.forEach(file => formData.append('images', file));

      // Append variants data as JSON
      const variantsToSubmit = formVariants.map(v => ({
        id: v.tempId.includes('-') ? v.tempId : undefined,
        name: v.name,
        price: v.price,
        costPrice: v.costPrice,
        discountPrice: v.discountPrice,
        stockQty: v.stockQty,
        imageUrl: v.imageUrl
      }));
      formData.append('variants', JSON.stringify(variantsToSubmit));
      formData.append('deletedVariants', JSON.stringify(deletedVariants));

      // Append variant files with specific fieldnames
      formVariants.forEach((v, idx) => {
        if (v.file) {
          formData.append(`variant_image_${idx}`, v.file);
        }
      });
      
      if (editingId) {
        await apiPut(`/products/${editingId}`, formData);
        toast.success('Produk berhasil diperbarui');
      } else {
        await apiPost<Product>('/products', formData);
        toast.success('Produk berhasil ditambahkan');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah produk');
    } finally {
      setIsSaving(false);
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
              <thead><tr><th>Produk</th><th>Kategori</th><th>Margin</th><th>Stok</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {hasVariants && (
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-hint)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', flexShrink: 0 }}>
                                chevron_right
                              </span>
                            )}
                            <div style={{ 
                              width: 48, height: 48, borderRadius: 'var(--radius-sm)', 
                              overflow: 'hidden', background: 'var(--divider)',
                              boxShadow: 'var(--shadow-sm)', flexShrink: 0
                            }}>
                              {p.images && p.images.length > 0 ? (
                                <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                  <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)', fontSize: 20 }}>image</span>
                                </div>
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ 
                                fontWeight: 600, 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                maxWidth: 320
                              }} title={p.name}>
                                {p.name}
                              </div>
                              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                {p.isFeatured && <span className="badge green" style={{ fontSize: 10, padding: '2px 6px' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>star</span> Pilihan</span>}
                                {hasVariants && <span className="badge blue" style={{ fontSize: 10, padding: '2px 6px' }}><span className="material-symbols-outlined" style={{ fontSize: 12 }}>tune</span> {p.variants.length} varian</span>}
                                {p.shopeeUrl && (
                                  <span className="badge orange" style={{ fontSize: 10, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <img src="/images/shopee_logo.svg" alt="Shopee" style={{ width: 12, height: 12 }} />
                                    Shopee
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span 
                            className="badge gray" 
                            style={{ 
                              maxWidth: 120, 
                              display: 'inline-block', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              verticalAlign: 'middle'
                            }} 
                            title={p.category?.name}
                          >
                            {p.category?.name || '-'}
                          </span>
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
                        const vSellPrice = v.discountPrice || v.price || sellPrice;
                        const vCostPrice = v.costPrice || p.costPrice || 0;
                        const vMargin = calcMargin(vSellPrice, vCostPrice);
                        const vProfit = vSellPrice - vCostPrice;
                        return (
                          <tr key={v.id} style={{ background: 'var(--primary-surface)' }}>
                            <td style={{ paddingLeft: hasVariants ? 72 : 48 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>subdirectory_arrow_right</span>
                                <span style={{ 
                                  fontWeight: 500, 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  maxWidth: 240
                                }} title={v.name}>
                                  {v.name}
                                </span>
                              </div>
                            </td>
                            <td></td>

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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{editingId ? 'edit' : 'add_shopping_cart'}</span> {editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button className="btn btn-outline btn-icon" onClick={handleCloseModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              {/* Top Gallery Section */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ marginBottom: 12 }}>Galeri Foto Produk</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                  {/* Existing images from server */}
                  {existingImages.map((url, idx) => (
                    <div key={`existing-${idx}`} style={{ 
                      width: '100%', height: 140, borderRadius: 'var(--radius-md)', 
                      background: 'var(--divider)', position: 'relative', overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--divider)'
                    }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" 
                        onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                      </button>
                    </div>
                  ))}

                  {/* Newly uploaded images */}
                  {formImages.map((file, idx) => (
                    <div key={`new-${idx}`} style={{ 
                      width: '100%', height: 140, borderRadius: 'var(--radius-md)', 
                      background: 'var(--divider)', position: 'relative', overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--divider)'
                    }}>
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" 
                        onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                      </button>
                    </div>
                  ))}

                  {/* Upload button */}
                  {(existingImages.length + formImages.length < 10) && (
                    <label className="upload-tile hover-scale" style={{ 
                      width: '100%', height: 140, borderRadius: 'var(--radius-md)', border: '2px dashed var(--divider)', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', color: 'var(--text-hint)', transition: 'all 0.2s',
                      background: 'var(--primary-surface)'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 4, color: 'var(--primary-light)' }}>add_photo_alternate</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Upload Foto</span>
                      <input 
                        type="file" 
                        multiple
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={e => {
                          if (e.target.files?.length) {
                            setFormImages(prev => [...prev, ...Array.from(e.target.files!)]);
                          }
                        }} 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Info Grid Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nama Produk</label>
                    <input className="form-input" placeholder="Masukkan nama produk" value={formName} onChange={e => setFormName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kategori</label>
                    <CustomSelect
                      value={productCategory}
                      onChange={setProductCategory}
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      placeholder="Pilih kategori"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Stok</label>
                    <input className="form-input" type="number" placeholder="0" value={formStock} onChange={e => setFormStock(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⭐ Rating Bintang (Mock)
                      <div className="tooltip-wrapper">
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-hint)', cursor: 'help' }}>info</span>
                        <span className="tooltip-text">Rating yang akan ditampilkan di halaman produk.</span>
                      </div>
                    </label>
                    <input className="form-input" type="number" step="0.1" max="5" placeholder="4.8" value={formRating} onChange={e => setFormRating(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Harga Beli
                      <div className="tooltip-wrapper">
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-hint)', cursor: 'help', pointerEvents: 'auto' }}>info</span>
                        <span className="tooltip-text">Harga beli (HPP) hanya terlihat di admin.</span>
                      </div>
                    </label>
                    <input className="form-input" type="number" placeholder="HPP" value={formCostPrice} onChange={e => setFormCostPrice(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Harga Jual</label>
                    <input className="form-input" type="number" placeholder="0" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Diskon</label>
                    <input className="form-input" type="number" placeholder="Opsional" value={formDiscountPrice} onChange={e => setFormDiscountPrice(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src="/images/shopee_logo.svg" alt="Shopee" style={{ width: 16, height: 16, display: 'inline-block', verticalAlign: 'middle', marginRight: 6, filter: 'brightness(0) contrast(0)' }} />
                  Link Shopee
                  <div className="tooltip-wrapper">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-hint)', cursor: 'help' }}>info</span>
                    <span className="tooltip-text">Link produk di Shopee. Tombol "Beli di Shopee" akan muncul di halaman produk.</span>
                  </div>
                </label>
                <input 
                  className="form-input" 
                  placeholder="https://shopee.co.id/product/..." 
                  value={formShopeeUrl} 
                  onChange={e => setFormShopeeUrl(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <TagInput tags={formTags} setTags={setFormTags} placeholder="Enter tag..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Ukuran (Size)</label>
                  <CreatableSelect
                    isMulti
                    options={sizeOptions}
                    value={formSizes.map(s => ({ value: s, label: s }))}
                    onChange={(val) => setFormSizes(val ? val.map((v: any) => v.value) : [])}
                    placeholder="Pilih atau ketik..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              <div style={formVariants.length > 0 ? { opacity: 0.5, pointerEvents: 'none', marginTop: 12 } : { marginTop: 12 }}>
                {formVariants.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4, marginBottom: 12 }}>* Harga utama diabaikan karena produk memiliki varian.</div>
                )}
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
                      <div key={v.tempId} style={{ padding: 14, background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: -3 }}>subdirectory_arrow_right</span> Varian {idx + 1}
                          </span>
                          <button className="btn btn-outline btn-icon" type="button" onClick={() => removeFormVariant(v.tempId)} style={{ width: 28, height: 28, color: 'var(--error)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 20, marginBottom: 4 }}>
                          <div style={{ flexShrink: 0 }}>
                            <label className="upload-tile hover-scale" style={{ 
                              width: 150, height: 150, borderRadius: 'var(--radius-md)', border: '2px dashed var(--divider)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', overflow: 'hidden', background: 'var(--primary-surface)', position: 'relative',
                              boxShadow: 'var(--shadow-sm)', color: 'var(--text-hint)'
                            }}>
                              {(v.file || v.imageUrl) ? (
                                <>
                                  <img 
                                    src={v.file ? URL.createObjectURL(v.file) : v.imageUrl} 
                                    alt="" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                  <div style={{ 
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.2s'
                                  }}>
                                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 24, opacity: 0.9 }}>edit</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--primary-light)', marginBottom: 8 }}>add_photo_alternate</span>
                                  <span style={{ fontSize: 12, fontWeight: 500 }}>Upload Foto</span>
                                </>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={e => {
                                  if (e.target.files?.[0]) {
                                    updateFormVariant(v.tempId, 'file', e.target.files[0] as any);
                                  }
                                }} 
                              />
                            </label>
                          </div>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: 11 }}>Nama Varian</label>
                              <input className="form-input" placeholder="cth: Besar, 1kg, 500ml" value={v.name} onChange={e => updateFormVariant(v.tempId, 'name', e.target.value)} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Harga Beli</label>
                                <input 
                                  className="form-input" 
                                  type="number" 
                                  placeholder={formCostPrice || "Ikuti Utama"} 
                                  value={v.costPrice} 
                                  onChange={e => updateFormVariant(v.tempId, 'costPrice', e.target.value)} 
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Harga Jual</label>
                                <input 
                                  className="form-input" 
                                  type="number" 
                                  placeholder={formPrice || "Ikuti Utama"} 
                                  value={v.price} 
                                  onChange={e => updateFormVariant(v.tempId, 'price', e.target.value)} 
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Diskon</label>
                                <input className="form-input" type="number" placeholder="Opsional" value={v.discountPrice} onChange={e => updateFormVariant(v.tempId, 'discountPrice', e.target.value)} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Stok</label>
                                <input className="form-input" type="number" placeholder="0" value={v.stockQty} onChange={e => updateFormVariant(v.tempId, 'stockQty', e.target.value)} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Margin</label>
                                <div style={{ height: 38, display: 'flex', alignItems: 'center' }}>
                                  <span className={`badge ${marginColor(calcMargin(
                                    parseInt(v.discountPrice) || parseInt(v.price) || parseInt(formPrice) || 0,
                                    parseInt(v.costPrice) || parseInt(formCostPrice) || 0
                                  ))}`}>
                                    {calcMargin(
                                      parseInt(v.discountPrice) || parseInt(v.price) || parseInt(formPrice) || 0,
                                      parseInt(v.costPrice) || parseInt(formCostPrice) || 0
                                    )}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button 
                      className="btn btn-outline" 
                      type="button" 
                      onClick={addFormVariant}
                      style={{ 
                        marginTop: 4, 
                        width: '100%', 
                        borderStyle: 'dashed', 
                        height: 50,
                        background: 'var(--primary-surface)',
                        borderColor: 'var(--primary-light)',
                        color: 'var(--primary-dark)'
                      }}
                    >
                      <span className="material-symbols-outlined">add_circle</span> Tambah Varian Lainnya
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSaving}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }}></span>
                ) : (
                  <span className="material-symbols-outlined">save</span>
                )}
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
