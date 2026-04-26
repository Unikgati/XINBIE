'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPut } from '@/lib/api';

interface DeliverySlot {
  id: string;
  dayOfWeek: number;
  label: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  cutoffHours: number;
  isActive: boolean;
  _count?: { orders: number };
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Standard slots for simplicity
const STANDARD_SLOTS = [
  { label: 'Pagi', startTime: '08:00', endTime: '12:00' },
  { label: 'Siang', startTime: '12:00', endTime: '16:00' },
  { label: 'Sore', startTime: '16:00', endTime: '20:00' },
  { label: 'Malam', startTime: '20:00', endTime: '24:00' },
];

export default function DeliverySlotsPage() {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formDay, setFormDay] = useState(1);
  const [formMaxOrders, setFormMaxOrders] = useState(50);
  const [formCutoff, setFormCutoff] = useState(3);
  
  // which standard slots are active? Map label -> boolean
  const [activeSlots, setActiveSlots] = useState<Record<string, boolean>>({});

  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<DeliverySlot[]>('/delivery-slots');
      setSlots(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat jadwal pengiriman');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group slots by day
  const groupedSlots = DAYS.map((dayName, dayIndex) => {
    return {
      dayOfWeek: dayIndex,
      dayName,
      slots: slots.filter(s => s.dayOfWeek === dayIndex && s.isActive),
    };
  });

  const openEdit = (dayIndex: number) => {
    const daySlots = slots.filter(s => s.dayOfWeek === dayIndex && s.isActive);
    
    setFormDay(dayIndex);
    setFormMaxOrders(daySlots[0]?.maxOrders || 50);
    setFormCutoff(daySlots[0]?.cutoffHours || 3);
    
    const activeMap: Record<string, boolean> = {};
    STANDARD_SLOTS.forEach(s => activeMap[s.label] = false);
    daySlots.forEach(s => activeMap[s.label] = true);
    
    setActiveSlots(activeMap);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payloadSlots = STANDARD_SLOTS.map(st => ({
        label: st.label,
        startTime: st.startTime,
        endTime: st.endTime,
        isActive: activeSlots[st.label] || false,
      }));

      const payload = {
        maxOrders: formMaxOrders,
        cutoffHours: formCutoff,
        slots: payloadSlots
      };

      await apiPut(`/delivery-slots/day/${formDay}`, payload);
      toast.success(`Jadwal hari ${DAYS[formDay]} diperbarui`);
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan jadwal');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal Pengiriman</h1>
          <p className="page-subtitle">Kelola jam operasional pengiriman per hari</p>
        </div>
      </div>

      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Hari</th>
                  <th style={{ width: '30%' }}>Slot Aktif</th>
                  <th style={{ width: 140 }}>Kapasitas</th>
                  <th style={{ width: 120 }}>Cutoff</th>
                  <th style={{ width: 64 }}></th>
                </tr>
              </thead>
              <tbody>
                {/* Reorder to show Monday first, Sunday last */}
                {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
                  const group = groupedSlots[dayIndex];
                  const hasActive = group.slots.length > 0;
                  
                  return (
                    <tr key={dayIndex} style={{ opacity: hasActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)' }}>calendar_today</span>
                          <span style={{ fontWeight: 600 }}>{group.dayName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {hasActive ? group.slots.map(s => (
                            <div key={s.id} className="badge green">
                              {s.label}
                            </div>
                          )) : (
                            <div className="badge gray">Libur</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {hasActive ? `${group.slots[0].maxOrders} pesanan` : '-'}
                      </td>
                      <td>
                        {hasActive ? `${group.slots[0].cutoffHours} jam` : '-'}
                      </td>
                      <td>
                        <ActionMenu items={[
                          { icon: 'edit', label: 'Edit Jadwal', onClick: () => openEdit(dayIndex) },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>event</span> 
                Atur Jadwal: {DAYS[formDay]}
              </h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Slot Waktu Aktif</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  {STANDARD_SLOTS.map((slot) => (
                    <label key={slot.label} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 16, 
                      padding: '16px', 
                      border: '1.5px solid', 
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: activeSlots[slot.label] ? 'rgba(76, 175, 80, 0.04)' : 'var(--surface)',
                      borderColor: activeSlots[slot.label] ? 'var(--primary)' : 'var(--border)',
                      boxShadow: activeSlots[slot.label] ? '0 4px 12px rgba(76, 175, 80, 0.08)' : 'none',
                      transition: 'all 0.2s ease',
                    }}>
                      {/* Hidden native checkbox */}
                      <input 
                        type="checkbox" 
                        checked={activeSlots[slot.label] || false} 
                        onChange={e => setActiveSlots({...activeSlots, [slot.label]: e.target.checked})} 
                        style={{ display: 'none' }} 
                      />
                      {/* Custom Checkbox UI */}
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: '2px solid',
                        borderColor: activeSlots[slot.label] ? 'var(--primary)' : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: activeSlots[slot.label] ? 'var(--primary)' : 'transparent',
                        transition: 'all 0.2s ease',
                      }}>
                        {activeSlots[slot.label] && <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>check</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: activeSlots[slot.label] ? 'var(--primary-dark)' : 'var(--text-primary)',
                          fontSize: 15,
                          transition: 'color 0.2s ease'
                        }}>{slot.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Maksimal Pesanan</label>
                    <div className="tooltip-wrapper">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)', cursor: 'help' }}>info</span>
                      <span className="tooltip-text">Batas maksimal jumlah pesanan per slot waktu.</span>
                    </div>
                  </div>
                  <input type="number" min={1} className="form-input" value={formMaxOrders} onChange={e => setFormMaxOrders(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Cutoff (Jam)</label>
                    <div className="tooltip-wrapper">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)', cursor: 'help' }}>info</span>
                      <span className="tooltip-text">Batas jam minimum pelanggan dapat memesan sebelum jadwal pengiriman dimulai.</span>
                    </div>
                  </div>
                  <input type="number" min={0} className="form-input" value={formCutoff} onChange={e => setFormCutoff(parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <span className="material-symbols-outlined">save</span> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
