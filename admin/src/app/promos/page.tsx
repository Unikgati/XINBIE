'use client';

import { useState } from 'react';

const mockPromos = [
  { id: '1', code: 'WELCOME10', type: 'percent', value: 10, minOrder: 50000, maxDiscount: 15000, used: 45, limit: 100, active: true, expires: '30 Apr 2026' },
  { id: '2', code: 'HEMAT20K', type: 'nominal', value: 20000, minOrder: 100000, maxDiscount: 20000, used: 12, limit: 50, active: true, expires: '25 Apr 2026' },
  { id: '3', code: 'FREEONGKIR', type: 'nominal', value: 10000, minOrder: 150000, maxDiscount: 10000, used: 80, limit: 80, active: false, expires: '15 Apr 2026' },
];

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function PromosPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Promo</h1>
          <p className="page-subtitle">{mockPromos.length} kode promo</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Buat Promo</button>
      </div>
      <div className="page-body">
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Min. Order</th><th>Penggunaan</th><th>Expired</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {mockPromos.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, letterSpacing: 1 }}>{p.code}</td>
                  <td><span className={`badge ${p.type === 'percent' ? 'blue' : 'purple'}`}>{p.type === 'percent' ? 'Persen' : 'Nominal'}</span></td>
                  <td style={{ fontWeight: 600 }}>{p.type === 'percent' ? `${p.value}%` : fmt(p.value)}</td>
                  <td>{fmt(p.minOrder)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--background)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(p.used / p.limit) * 100}%`, height: '100%', background: p.used >= p.limit ? 'var(--error)' : 'var(--primary)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{p.used}/{p.limit}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-hint)' }}>{p.expires}</td>
                  <td><span className={`badge ${p.active ? 'green' : 'gray'}`}>{p.active ? 'Aktif' : 'Expired'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline btn-sm">✏️</button>
                      <button className="btn btn-danger btn-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Buat Promo</h3><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Kode Promo</label><input className="form-input" placeholder="KODEPROMO" style={{ textTransform: 'uppercase' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Tipe</label><select className="form-select"><option value="percent">Persen (%)</option><option value="nominal">Nominal (Rp)</option></select></div>
                <div className="form-group"><label className="form-label">Nilai</label><input className="form-input" type="number" placeholder="10" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Min. Order (Rp)</label><input className="form-input" type="number" placeholder="50000" /></div>
                <div className="form-group"><label className="form-label">Maks. Diskon (Rp)</label><input className="form-input" type="number" placeholder="15000" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Limit Penggunaan</label><input className="form-input" type="number" placeholder="100" /></div>
                <div className="form-group"><label className="form-label">Expired</label><input className="form-input" type="date" /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn-primary" onClick={() => setShowModal(false)}>Simpan</button></div>
          </div>
        </div>
      )}
    </>
  );
}
