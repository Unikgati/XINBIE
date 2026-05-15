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
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    products: number;
  };
}

function SortableRow({ 
  category, 
  onEdit, 
  onToggle,
  onDelete
}: { 
  category: Category; 
  onEdit: (c: Category) => void;
  onToggle: (c: Category) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? 'var(--bg-secondary, #f9fafb)' : undefined,
    zIndex: isDragging ? 1 : 0,
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{category.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{category.slug}</span>
        </div>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{category._count?.products || 0} Produk</td>
      <td><span className={`badge ${category.isActive ? 'green' : 'gray'}`}>{category.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <ActionMenu items={[
          { icon: 'edit', label: 'Ubah Kategori', onClick: () => onEdit(category) },
          { icon: category.isActive ? 'visibility_off' : 'visibility', label: category.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => onToggle(category) },
          { icon: 'delete', label: 'Hapus Kategori', onClick: () => onDelete(category.id, category.name), danger: true },
        ]} />
      </td>
    </tr>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    setCategories(reordered);

    try {
      await apiPut('/categories/reorder', { orderedIds: reordered.map((c) => c.id) });
      toast.success('Urutan kategori diperbarui');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan urutan');
      fetchData();
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nama kategori wajib diisi'); return; }
    if (isSaving) return;

    try {
      setIsSaving(true);
      const fd = new FormData();
      fd.append('name', formName);

      if (editingId) {
        await apiPut(`/categories/${editingId}`, fd);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await apiPost('/categories', fd);
        toast.success('Kategori berhasil ditambahkan');
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Hapus Kategori',
      message: `Hapus kategori "${name}"? Pastikan tidak ada produk yang terhubung ke kategori ini.`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;

    try {
      await apiDelete(`/categories/${id}`);
      toast.success('Kategori berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kategori');
    }
  };

  const handleToggle = async (c: Category) => {
    try {
      await apiPut(`/categories/${c.id}`, { isActive: !c.isActive });
      toast.success(`Kategori "${c.name}" ${c.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setFormName(c.name);
    setShowModal(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="page-subtitle">{categories.length} kategori terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Kategori
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={4} columns={4} />
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
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th>Kategori</th>
                        <th>Jumlah Produk</th>
                        <th>Status</th>
                        <th style={{ width: 48 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <SortableRow 
                          key={c.id} 
                          category={c} 
                          onEdit={openEdit} 
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>category</span> {editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="cth: Alat Kesehatan" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSaving}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }}></span>
                ) : (
                  <span className="material-symbols-outlined">save</span>
                )}
                {isSaving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Kategori')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
