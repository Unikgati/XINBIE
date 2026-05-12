'use client';

import React from 'react';
import styles from '../page.module.css';

interface DeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

interface CheckoutScheduleProps {
  scheduledDate: Date;
  deliverySlot: DeliverySlot | null;
  onTap: () => void;
}

export default function CheckoutSchedule({ scheduledDate, deliverySlot, onTap }: CheckoutScheduleProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const scheduleDisplay = deliverySlot 
    ? `${formatDate(scheduledDate)} • ${deliverySlot.label}`
    : 'Belum diatur';

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Jadwal Pengiriman</h2>
        </div>
        <button className={styles.sectionAction} onClick={onTap}>
          {deliverySlot ? 'Ganti' : 'Atur'}
        </button>
      </div>

      <div className={styles.sectionContent}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {deliverySlot ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#4CAF50' }}>
                {formatDate(scheduledDate)}
              </span>
              <span style={{ color: '#4CAF50', opacity: 0.6, fontSize: '10px' }}>●</span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#4CAF50' }}>
                {deliverySlot.label}
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#9E9E9E' }}>
              Belum diatur
            </p>
          )}
          <p style={{ margin: 0, fontSize: '12px', color: '#9E9E9E' }}>
            {deliverySlot ? 'Jadwal Pilihan' : 'Default H+2'}
          </p>
        </div>

        {!deliverySlot && (
          <div style={{ 
            marginTop: '16px', 
            padding: '14px 16px', 
            backgroundColor: '#FFEBEE', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#E53935', fontSize: '20px' }}>
              error_outline
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: '#C62828', fontWeight: 500, lineHeight: 1.4 }}>
              Mohon atur jadwal pengiriman sebelum melanjutkan pesanan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
