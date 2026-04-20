'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';

const mockBanners = [
  { id: '1', title: 'Gratis Ongkir', type: 'hero', active: true, link: 'promo/free-delivery' },
  { id: '2', title: 'Diskon 20% Sayuran', type: 'promo', active: true, link: 'category/sayuran' },
  { id: '3', title: 'Ramadan Special', type: 'promo', active: false, link: 'promo/ramadan' },
];

export default function BannersPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banner</h1>
          <p className="page-subtitle">Kelola banner promosi</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">add_photo_alternate</span> Tambah Banner
        </button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {mockBanners.map(b => (
            <div key={b.id} className="banner-card">
              <div className={`banner-preview ${b.type}`}>
                <span>{b.title}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${b.type === 'hero' ? 'green' : 'orange'}`}>
                      <span className="material-symbols-outlined">{b.type === 'hero' ? 'featured_video' : 'campaign'}</span> {b.type.toUpperCase()}
                    </span>
                    <span className={`badge ${b.active ? 'green' : 'gray'}`}>{b.active ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  <ActionMenu items={[
                    { icon: 'edit', label: 'Edit Banner', onClick: () => {} },
                    { icon: b.active ? 'visibility_off' : 'visibility', label: b.active ? 'Nonaktifkan' : 'Aktifkan', onClick: () => {} },
                    { icon: 'delete', label: 'Hapus', onClick: () => {}, danger: true },
                  ]} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-hint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span> {b.link}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>photo_library</span> Tambah Banner</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Judul</label><input className="form-input" placeholder="Judul banner" /></div>
              <div className="form-group"><label className="form-label">Tipe</label><select className="form-select"><option>hero</option><option>promo</option></select></div>
              <div className="form-group"><label className="form-label">Link / Action</label><input className="form-input" placeholder="category/sayuran" /></div>
              <div className="form-group"><label className="form-label">Upload Gambar</label><div className="upload-area"><span className="material-symbols-outlined">cloud_upload</span><div>Drag & drop atau klik untuk upload</div></div></div>
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
