'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ActionMenu from '@/components/ActionMenu';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPost, apiPut } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  iconUrl?: string;
  bgColor: string;
  sortOrder?: number;
  _count?: { products: number };
}

function SortableRow({ cat, onEdit }: { cat: Category; onEdit: (c: Category) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? 'var(--bg-secondary, #f9fafb)' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ width: 40, padding: '12px 8px' }}>
        <button
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary, #9ca3af)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
          title="Drag untuk mengubah urutan"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>drag_indicator</span>
        </button>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="category-icon" style={{ width: 40, height: 40, background: cat.bgColor }}>
            {cat.iconUrl ? (
              <img src={cat.iconUrl} alt={cat.name} style={{ width: 24, height: 24 }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>category</span>
            )}
          </div>
          <span style={{ fontWeight: 600 }}>{cat.name}</span>
        </div>
      </td>
      <td>{cat._count?.products || 0} produk</td>
      <td>
        <ActionMenu items={[
          { icon: 'edit', label: 'Edit', onClick: () => onEdit(cat) },
        ]} />
      </td>
    </tr>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#4CAF50');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<Category[]>('/categories');
      setCategories(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormName(''); setFormColor('#4CAF50'); setIconFile(null); setIconPreview(''); setEditId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormColor(cat.bgColor);
    setIconPreview(cat.iconUrl || '');
    setEditId(cat.id);
    setShowModal(true);
  };

  const handleCloseModal = async () => {
    if (formName || iconFile || formColor !== '#4CAF50') {
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

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nama kategori wajib diisi'); return; }
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('bgColor', formColor);
      if (iconFile) formData.append('icon', iconFile);

      if (editId) {
        await apiPut(`/categories/${editId}`, formData);
        toast.success(`Kategori "${formName}" diperbarui`);
      } else {
        await apiPost('/categories', formData);
        toast.success(`Kategori "${formName}" ditambahkan`);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Optimistic update
    setCategories(reordered);

    try {
      await apiPut('/categories/reorder', { orderedIds: reordered.map((c) => c.id) });
      toast.success('Urutan kategori diperbarui');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan urutan');
      fetchData(); // Rollback on failure
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="page-subtitle">{categories.length} kategori</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Kategori
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">category</span>
              Belum ada kategori
            </div>
          ) : (
            <div className="table-responsive">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <table className="data-table">
                  <thead><tr><th style={{ width: 40 }}></th><th>Kategori</th><th>Produk</th><th style={{ width: 48 }}></th></tr></thead>
                  <tbody>
                    {categories.map((c) => (
                      <SortableRow key={c.id} cat={c} onEdit={openEdit} />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>category</span> {editId ? 'Edit' : 'Tambah'} Kategori</h3>
              <button className="btn btn-outline btn-icon" onClick={handleCloseModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nama Kategori</label><input className="form-input" placeholder="Masukkan nama" value={formName} onChange={e => setFormName(e.target.value)} /></div>
              <div className="form-group">
                <label className="form-label">Warna Background</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} style={{ width: 44, height: 44, padding: 2, border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formColor.toUpperCase()}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ikon Kategori</label>
                <FileUpload
                  accept=".svg,.png,.webp"
                  icon="category"
                  label="Upload ikon SVG, PNG, atau WebP"
                  hint="Maksimal 500KB"
                  maxSize={500}
                  preview={iconPreview}
                  previewBg={formColor}
                  onChange={(file) => { setIconFile(file); setIconPreview(URL.createObjectURL(file)); }}
                  onError={(msg) => toast.error(msg)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}><span className="material-symbols-outlined">save</span> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
