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
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  type: string;
  actionType?: string;
  actionValue?: string;
  isActive: boolean;
  sortOrder: number;
}

function SortableRow({ 
  banner, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  banner: Banner; 
  onEdit: (b: Banner) => void;
  onDelete: (id: string, title: string) => void;
  onToggle: (b: Banner) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {banner.imageUrl && (
            <img 
              src={banner.imageUrl} 
              alt={banner.title} 
              style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 6 }} 
            />
          )}
          <span style={{ fontWeight: 600 }}>{banner.title}</span>
        </div>
      </td>
      <td><span className="badge gray">{banner.type}</span></td>
      <td><span className={`badge ${banner.isActive ? 'green' : 'gray'}`}>{banner.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <ActionMenu items={[
          { icon: 'edit', label: 'Ubah Banner', onClick: () => onEdit(banner) },
          { icon: banner.isActive ? 'visibility_off' : 'visibility', label: banner.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => onToggle(banner) },
          { icon: 'delete', label: 'Hapus', onClick: () => onDelete(banner.id, banner.title), danger: true },
        ]} />
      </td>
    </tr>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('PROMO');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<Banner[]>('/banners');
      setBanners(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat banner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);

    setBanners(reordered);

    try {
      await apiPut('/banners/reorder', { orderedIds: reordered.map((b) => b.id) });
      toast.success('Urutan banner diperbarui');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan urutan');
      fetchData();
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error('Judul wajib diisi'); return; }
    if (!editingId && !imageFile) { toast.error('Gambar wajib diisi untuk banner baru'); return; }

    try {
      const fd = new FormData();
      fd.append('title', formTitle);
      fd.append('type', formType);
      if (imageFile) fd.append('image', imageFile);

      if (editingId) {
        await apiPut(`/banners/${editingId}`, fd);
        toast.success('Banner berhasil diperbarui');
      } else {
        await apiPost('/banners', fd);
        toast.success('Banner berhasil ditambahkan');
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan banner');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({ 
      title: 'Hapus Banner', 
      message: `Hapus banner "${title}"? Tindakan ini tidak dapat dibatalkan.`, 
      confirmLabel: 'Hapus', 
      danger: true 
    });
    if (!ok) return;
    try {
      await apiDelete(`/banners/${id}`);
      toast.success('Banner berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus banner');
    }
  };

  const handleToggle = async (b: Banner) => {
    try {
      await apiPut(`/banners/${b.id}`, { isActive: !b.isActive });
      toast.success(`Banner "${b.title}" ${b.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormTitle(''); setFormType('PROMO'); setImageFile(null); setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setFormTitle(b.title);
    setFormType(b.type);
    setImageFile(null);
    setImagePreview(b.imageUrl);
    setShowModal(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banner</h1>
          <p className="page-subtitle">{banners.length} banner terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span> Tambah Banner
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : banners.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">image</span>
              Belum ada banner
            </div>
          ) : (
            <div className="table-responsive">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th>Banner</th>
                        <th>Tipe</th>
                        <th>Status</th>
                        <th style={{ width: 48 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.map((b) => (
                        <SortableRow 
                          key={b.id} 
                          banner={b} 
                          onEdit={openEdit} 
                          onDelete={handleDelete} 
                          onToggle={handleToggle}
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
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>image</span> {editingId ? 'Edit Banner' : 'Tambah Banner'}</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul</label>
                <input className="form-input" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Judul banner" />
              </div>
              <div className="form-group">
                <label className="form-label">Gambar Banner</label>
                <FileUpload
                  accept="image/*"
                  icon="image"
                  label={editingId ? "Ganti gambar banner (opsional)" : "Upload gambar banner"}
                  hint="Format JPG, PNG, WebP — maks 2MB (Rekomendasi rasio 2.5:1, cth: 1000x400 px)"
                  maxSize={2048}
                  preview={imagePreview}
                  onChange={(file) => { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }}
                  onError={(msg) => toast.error(msg)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <span className="material-symbols-outlined">save</span> {editingId ? 'Simpan Perubahan' : 'Simpan Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
