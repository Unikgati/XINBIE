'use client';

import { useState } from 'react';
import CustomSelect from '@/components/CustomSelect';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiPost } from '@/lib/api';

export default function BroadcastPage() {
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState('ALL');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [history, setHistory] = useState<{ id: string; title: string; body: string; target: string; sent: number; date: string }[]>([]);
  const toast = useToast();
  const confirm = useConfirm();

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error('Judul dan isi pesan wajib diisi'); return; }
    const ok = await confirm({
      title: 'Kirim Broadcast',
      message: `Kirim notifikasi "${title}" ke ${target === 'ALL' ? 'semua pengguna' : target === 'USER' ? 'pelanggan' : 'driver'}?`,
      confirmLabel: 'Kirim',
    });
    if (!ok) return;
    try {
      const res = await apiPost<{ message: string }>('/broadcast', { title, body, target });
      toast.success(res.message || 'Broadcast terkirim');
      setHistory(prev => [{ id: Date.now().toString(), title, body, target, sent: 0, date: new Date().toLocaleString('id-ID') }, ...prev]);
      setShowModal(false);
      setTitle(''); setBody('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim broadcast');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Broadcast</h1>
          <p className="page-subtitle">Kirim notifikasi ke pengguna</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">send</span> Kirim Broadcast
        </button>
      </div>
      <div className="page-body">
        <div className="data-card">
          {history.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">campaign</span>
              Belum ada riwayat broadcast
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Judul</th><th>Target</th><th>Tanggal</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{h.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{h.body.substring(0, 60)}...</div>
                    </td>
                    <td><span className="badge gray">{h.target}</span></td>
                    <td style={{ fontSize: 13 }}>{h.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>campaign</span> Kirim Broadcast</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Target</label>
                <CustomSelect value={target} onChange={setTarget} options={[
                  { value: 'ALL', label: 'Semua Pengguna' },
                  { value: 'USER', label: 'Pelanggan' },
                  { value: 'DRIVER', label: 'Driver' },
                ]} />
              </div>
              <div className="form-group"><label className="form-label">Judul</label><input className="form-input" placeholder="Judul notifikasi" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Isi Pesan</label><textarea className="form-input" rows={4} placeholder="Tulis pesan broadcast..." value={body} onChange={e => setBody(e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSend}><span className="material-symbols-outlined">send</span> Kirim</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
