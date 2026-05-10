'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Select, { components } from 'react-select';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton, TableRowSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import RichTextEditor from '@/components/RichTextEditor';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import AsyncProductSelect from '@/components/AsyncProductSelect';

interface Step {
  id?: string;
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
}

interface Recipe {
  id: string;
  title: string;
  slug: string;
  heroImage?: string;
  relatedProductIds: string[];
  ingredients: string[];
  createdAt: string;
  steps: Step[];
  _count?: { steps: number };
}

interface Product {
  id: string;
  name: string;
  images: string[];
}


export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    relatedProductIds: [] as string[],
    ingredients: [] as string[],
  });
  const [steps, setSteps] = useState<Step[]>([]);
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);
  const [relatedProductOptions, setRelatedProductOptions] = useState<any[]>([]);

  const toast = useToast();
  const confirm = useConfirm();

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet(`/recipes?page=${page}&search=${searchTerm}`);
      setRecipes(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      toast.error('Gagal mengambil data resep');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, toast]);


  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleOpenModal = async (recipe: Recipe | null = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        title: recipe.title,
        relatedProductIds: recipe.relatedProductIds || [],
        ingredients: recipe.ingredients || [],
      });
      setSteps(recipe.steps || []);
      setPreviewUrl(recipe.heroImage || null);
      
      // Fetch details for related products
      if (recipe.relatedProductIds?.length > 0) {
        try {
          const res = await apiGet<any>(`/products?ids=${recipe.relatedProductIds.join(',')}`);
          const products = res.data || (Array.isArray(res) ? res : []);
          setRelatedProductOptions(products.map((p: any) => ({
            value: p.id,
            label: p.name,
            image: p.images?.[0] || null
          })));
        } catch (err) {
          console.error('Failed to fetch related products details', err);
        }
      } else {
        setRelatedProductOptions([]);
      }
    } else {
      setEditingRecipe(null);
      setFormData({
        title: '',
        relatedProductIds: [],
        ingredients: [''],
      });
      setSteps([{ stepNumber: 1, instruction: '' }]);
      setExpandedStepIndex(0);
      setPreviewUrl(null);
      setRelatedProductOptions([]);
    }
    setHeroImage(null);
    setModalOpen(true);
  };

  const handleAddStep = () => {
    const next = [...steps, { stepNumber: steps.length + 1, instruction: '' }];
    setSteps(next);
    setExpandedStepIndex(next.length - 1);
  };

  const handleRemoveStep = (index: number) => {
    const next = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(next);
  };

  const handleUpdateStep = (index: number, value: string) => {
    const next = [...steps];
    next[index] = { ...next[index], instruction: value };
    setSteps(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          body.append(key, JSON.stringify(val));
        } else {
          body.append(key, String(val));
        }
      });

      body.append('steps', JSON.stringify(steps));
      if (heroImage) body.append('heroImage', heroImage);

      if (editingRecipe) {
        await apiPut(`/recipes/${editingRecipe.id}`, body);
        toast.success('Resep diperbarui');
      } else {
        await apiPost('/recipes', body);
        toast.success('Resep berhasil dibuat');
      }
      setModalOpen(false);
      fetchRecipes();
    } catch (err) {
      toast.error('Gagal menyimpan resep');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recipe: Recipe) => {
    const ok = await confirm({
      title: 'Hapus Resep?',
      message: `Yakin ingin menghapus resep "${recipe.title}"?`,
      confirmLabel: 'Hapus',
      danger: true
    });
    if (!ok) return;

    try {
      await apiDelete(`/recipes/${recipe.id}`);
      toast.success('Resep dihapus');
      fetchRecipes();
    } catch (err) {
toast.error('Gagal menghapus resep');
    }
  };



  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inspirasi Resep</h1>
          <p className="page-subtitle">Kelola panduan memasak dan relasi bahan ke produk</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span className="material-symbols-outlined">add</span>
          Tambah Resep
        </button>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <span className="material-symbols-outlined search-icon">search</span>
            <input 
              type="text" 
              placeholder="Cari resep..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecipes()}
            />
          </div>
        </div>

        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={2} />
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">restaurant_menu</span>
              {searchTerm ? 'Tidak ada resep yang cocok' : 'Belum ada resep'}
            </div>
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resep</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          width: 64, height: 64, borderRadius: 'var(--radius-md)', 
                          overflow: 'hidden', background: 'var(--divider)',
                          boxShadow: 'var(--shadow-sm)', flexShrink: 0
                        }}>
                          {r.heroImage ? (
                            <img src={r.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)' }}>image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{r.title}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <span className="badge blue" style={{ fontSize: 10, padding: '2px 8px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>shopping_basket</span>
                              {r.relatedProductIds?.length || 0} Produk
                            </span>
                            <span className="badge purple" style={{ fontSize: 10, padding: '2px 8px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>format_list_numbered</span>
                              {r._count?.steps || 0} Langkah
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <ActionMenu items={[
                        { icon: 'edit', label: 'Edit', onClick: () => handleOpenModal(r) },
                        { icon: 'delete', label: 'Hapus', onClick: () => handleDelete(r), danger: true },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          
          {!loading && recipes.length > 0 && totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--divider)' }}>
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3>{editingRecipe ? 'Edit Resep' : 'Tambah Resep Baru'}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 24 }}>
                  <div className="image-section">
                    <label className="form-label">Foto Utama</label>
                    <div 
                      className="image-upload-box" 
                      onClick={() => document.getElementById('heroInput')?.click()}
                      style={{ 
                        height: 200, 
                        width: '100%', 
                        borderRadius: 'var(--radius-lg)',
                        border: '2px dashed var(--divider)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'var(--primary-surface)'
                      }}
                    >
                      {previewUrl ? (
                        <>
                          <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ 
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            opacity: 0, transition: 'opacity 0.2s', color: '#fff'
                          }} className="hover-overlay">
                            <span className="material-symbols-outlined">edit</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-hint)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--primary-light)' }}>add_a_photo</span>
                          <div style={{ fontSize: 12, marginTop: 8, fontWeight: 500 }}>Klik untuk upload</div>
                        </div>
                      )}
                      <input 
                        id="heroInput"
                        type="file" 
                        hidden 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setHeroImage(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="info-section" style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Judul Resep</label>
                      <input 
                        className="form-input"
                        placeholder="Cth: Tumis Kangkung Belacan"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Produk Terkait (Bahan)</label>
                      <AsyncProductSelect
                        isMulti
                        placeholder="Cari produk bahan masakan..."
                        value={relatedProductOptions}
                        onChange={(selected: any) => {
                          const options = selected || [];
                          setRelatedProductOptions(options);
                          setFormData({ ...formData, relatedProductIds: options.map((o: any) => o.value) });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 24, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>list_alt</span>
                      Daftar Bahan (Umum)
                    </h4>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setFormData({ ...formData, ingredients: [...formData.ingredients, ''] })}>
                      <span className="material-symbols-outlined">add</span> Tambah Bahan
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input 
                          className="form-input"
                          placeholder="Cth: 3 siung bawang putih"
                          value={ing}
                          onChange={(e) => {
                            const next = [...formData.ingredients];
                            next[idx] = e.target.value;
                            setFormData({ ...formData, ingredients: next });
                          }}
                        />
                        <button type="button" className="btn btn-outline btn-icon" style={{ color: 'var(--error)', height: '40px', width: '40px', flexShrink: 0 }} onClick={() => setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== idx) })}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {formData.ingredients.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ marginTop: 12, width: '100%', borderStyle: 'dashed', background: 'var(--primary-surface)', color: 'var(--primary-dark)', borderColor: 'var(--primary-light)' }} 
                      onClick={() => setFormData({ ...formData, ingredients: [...formData.ingredients, ''] })}
                    >
                      <span className="material-symbols-outlined">add_circle</span> Tambah Bahan Lainnya
                    </button>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>format_list_numbered</span>
                      Langkah-langkah Memasak
                    </h4>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddStep}>
                      <span className="material-symbols-outlined">add</span> Tambah Langkah
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {steps.map((step, idx) => {
                      const isExpanded = expandedStepIndex === idx;
                      // Simple regex to strip HTML tags for snippet view
                      const snippet = step.instruction.replace(/<[^>]*>/g, ' ').substring(0, 100);
                      
                      return (
                        <div key={idx} style={{ 
                          padding: 16, 
                          background: isExpanded ? 'var(--surface)' : 'var(--background)', 
                          borderRadius: 'var(--radius-md)', 
                          border: isExpanded ? '1px solid var(--primary-light)' : '1px solid var(--divider)',
                          boxShadow: isExpanded ? 'var(--shadow-sm)' : 'none',
                          transition: 'all 0.2s ease'
                        }}>
                          <div 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? 12 : 0, cursor: 'pointer' }}
                            onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                              <span className="material-symbols-outlined" style={{ 
                                fontSize: 18, 
                                color: isExpanded ? 'var(--primary)' : 'var(--text-hint)',
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s'
                              }}>
                                chevron_right
                              </span>
                              <span style={{ fontWeight: 600, color: isExpanded ? 'var(--primary-dark)' : 'var(--text-secondary)', fontSize: 14 }}>Langkah {step.stepNumber}</span>
                              {!isExpanded && step.instruction && (
                                <span style={{ fontSize: 12, color: 'var(--text-hint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                                  — {snippet}...
                                </span>
                              )}
                            </div>
                            <button type="button" className="btn btn-outline btn-icon" style={{ width: 28, height: 28, color: 'var(--error)', border: 'none' }} onClick={(e) => { e.stopPropagation(); handleRemoveStep(idx); }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                            </button>
                          </div>
                          
                          {isExpanded && (
                            <div className="fade-in">
                              <RichTextEditor 
                                value={step.instruction}
                                onChange={val => handleUpdateStep(idx, val)}
                                placeholder="Tulis instruksi langkah ini..."
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {steps.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ marginTop: 16, width: '100%', borderStyle: 'dashed', background: 'var(--primary-surface)', color: 'var(--primary-dark)', borderColor: 'var(--primary-light)', height: 48 }} 
                      onClick={handleAddStep}
                    >
                      <span className="material-symbols-outlined">add_circle</span> Tambah Langkah Lainnya
                    </button>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--divider)', background: 'var(--surface-alt)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : editingRecipe ? 'Simpan Perubahan' : 'Buat Resep'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .image-upload-box:hover .hover-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
