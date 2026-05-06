'use client';

import React, { useState, useEffect } from 'react';
import styles from './ScheduleModal.module.css';
import { api } from '@/lib/api';
import DgSkeleton from '@/components/DgSkeleton';

interface DeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  initialSlot: DeliverySlot | null;
  onConfirm: (date: Date, slot: DeliverySlot) => void;
}

export default function ScheduleModal({ 
  isOpen, 
  onClose, 
  initialDate, 
  initialSlot, 
  onConfirm 
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(initialSlot);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSlots(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const fetchSlots = async (date: Date) => {
    try {
      setLoadingSlots(true);
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get<any>(`/delivery/slots?date=${dateStr}`);
      
      const isToday = date.toDateString() === new Date().toDateString();
      let displaySlots = [...(res.slots || [])];

      if (isToday) {
        displaySlots.unshift({
          id: 'INSTANT',
          label: 'Instant (Dikirim Segera)',
          startTime: 'Sekarang',
          endTime: 'Tiba dalam 1-2 Jam',
        });
      }

      setSlots(displaySlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const isSameDate = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.handle} />
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Pilih Jadwal Pengiriman</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <p className={styles.sectionTitle}>Pilih Tanggal</p>
          <div className={styles.dateList}>
            {availableDates.map((date, idx) => {
              const active = isSameDate(date, selectedDate);
              const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
              const isToday = date.toDateString() === new Date().toDateString();
              const dayStr = isToday ? 'HARI INI' : days[date.getDay()];

              return (
                <button
                  key={idx}
                  className={`${styles.dateItem} ${active ? styles.dateItemActive : styles.dateItemInactive}`}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                >
                  <span className={styles.dayLabel}>{dayStr}</span>
                  <span className={styles.dateValue}>{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <p className={styles.sectionTitle}>Pilih Waktu</p>
          <div className={styles.slotList}>
            {loadingSlots ? (
              [1, 2, 3].map((i) => <DgSkeleton key={i} width="100%" height="70px" borderRadius="12px" />)
            ) : slots.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
                Tidak ada jadwal tersedia untuk tanggal ini.
              </p>
            ) : (
              slots.map((slot) => {
                const active = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    className={`${styles.slotItem} ${active ? styles.slotItemActive : styles.slotItemInactive}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <span className={styles.slotLabel}>{slot.label}</span>
                    <span className={styles.slotTime}>
                      {slot.id === 'INSTANT' ? slot.endTime : `${slot.startTime} - ${slot.endTime}`}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.confirmBtn}
            disabled={!selectedSlot}
            onClick={() => selectedSlot && onConfirm(selectedDate, selectedSlot)}
          >
            Konfirmasi Jadwal
          </button>
        </div>
      </div>
    </div>
  );
}
