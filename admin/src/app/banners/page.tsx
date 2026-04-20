'use client';

import { useState } from 'react';
import ActionMenu from '@/components/ActionMenu';
import CustomSelect from '@/components/CustomSelect';

const mockBanners = [
  { id: '1', title: 'Gratis Ongkir', type: 'hero', active: true, link: 'promo/free-delivery', imageUrl: '' },
  { id: '2', title: 'Diskon 20% Sayuran', type: 'promo', active: true, link: 'category/sayuran', imageUrl: '' },
  { id: '3', title: 'Ramadan Special', type: 'promo', active: false, link: 'promo/ramadan', imageUrl: '' },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RECOMMENDED_SIZE = '1200 × 600 px';

export default function BannersPage() {
  const [showModal, setShowModal] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState('HERO');

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banner</h1>
          <p className="page-subtitle">Kelola banner promosi &bull; Rekomendasi {RECOMMENDED_SIZE}, maks 2MB</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">add_photo_alternate</span> Tambah Banner
        </button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {mockBanners.map(b => (
            <div key={b.id} className="banner-card" style={{ overflow: 'visible', position: 'relative' }}>
              {/* Image Preview */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '2 / 1',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  background: b.type === 'hero'
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.4 }}>image</span>
                <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>{b.title}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{RECOMMENDED_SIZE}</div>
                {!b.active && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="badge gray" style={{ fontSize: 14, padding: '6px 16px' }}>
                      <span className="material-symbols-outlined">visibility_off</span> Nonaktif
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
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
                    { icon: 'cloud_upload', label: 'Ganti Gambar', onClick: () => {} },
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Tipe</label><CustomSelect value={bannerType} onChange={setBannerType} options={[{ value: 'HERO', label: 'Hero' }, { value: 'PROMO', label: 'Promo' }]} /></div>
                <div className="form-group"><label className="form-label">Link / Action</label><input className="form-input" placeholder="category/sayuran" /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Upload Gambar Banner</label>
                <div
                  className={`upload-area ${dragOver === 'banner' ? 'active' : ''}`}
                  style={{ aspectRatio: '2 / 1', cursor: 'pointer' }}
                  onDragOver={e => { e.preventDefault(); setDragOver('banner'); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); setDragOver(null); }}
                  onClick={() => document.getElementById('banner-upload')?.click()}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 40 }}>cloud_upload</span>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>Drag & drop atau klik untuk upload</div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 4 }}>
                    JPG, PNG, WebP &bull; Maks 2MB &bull; Rekomendasi {RECOMMENDED_SIZE}
                  </div>
                  <input id="banner-upload" type="file" accept={ACCEPTED_TYPES.join(',')} hidden />
                </div>
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
