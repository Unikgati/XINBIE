'use client';

import React, { useState } from 'react';
import styles from '../page.module.css';

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onTap: () => void;
}

export default function PaymentMethodSelector({ selectedMethod, onTap }: PaymentMethodSelectorProps) {
  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'GOPAY': return 'GoPay';
      case 'SHOPEEPAY': return 'ShopeePay';
      case 'QRIS': return 'QRIS';
      case 'ALFAMART': return 'Alfamart';
      case 'INDOMARET': return 'Indomaret';
      case 'VA_BCA': return 'BCA Virtual Account';
      case 'VA_MANDIRI': return 'Mandiri Virtual Account';
      case 'VA_BNI': return 'BNI Virtual Account';
      case 'COD': return 'Bayar di Tempat (COD)';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m === 'gopay') return '/images/payments/gopay.png';
    if (m === 'shopeepay') return '/images/payments/shopeepay.png';
    if (m === 'qris') return '/images/payments/qris.png';
    if (m.includes('bca')) return '/images/payments/bca.png';
    if (m.includes('mandiri')) return '/images/payments/mandiri.png';
    if (m.includes('bni')) return '/images/payments/bni.png';
    if (m.includes('alfamart')) return '/images/payments/alfamart.png';
    if (m.includes('indomaret')) return '/images/payments/indomaret.png';
    if (m === 'cod') return '/images/payments/cod.png';
    return null;
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Metode Pembayaran</h2>
        </div>
        <button className={styles.sectionAction} onClick={onTap}>
          {selectedMethod ? 'Ganti' : 'Pilih'}
        </button>
      </div>

      <div className={styles.sectionContent}>
        {selectedMethod ? (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '16px',
              backgroundColor: '#FAFAFA',
              borderRadius: '16px',
              cursor: 'pointer',
              border: '1px solid #F0F0F0'
            }}
            onClick={onTap}
          >
            <div style={{ width: '40px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getMethodIcon(selectedMethod) ? (
                <img src={getMethodIcon(selectedMethod)!} alt={selectedMethod} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary-action)' }}>payments</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {getMethodDisplayName(selectedMethod)}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Metode terpilih
              </p>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#bdbdbd' }}>chevron_right</span>
          </div>
        ) : (
          <div 
            style={{ 
              padding: '14px 16px', 
              backgroundColor: '#FFEBEE', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
            onClick={onTap}
          >
            <span className="material-symbols-outlined" style={{ color: '#E53935', fontSize: '20px' }}>
              error_outline
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: '#C62828', fontWeight: 500, lineHeight: 1.4 }}>
              Mohon pilih metode pembayaran.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
