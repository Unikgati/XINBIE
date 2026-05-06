'use client';

import React, { useState } from 'react';
import styles from '../page.module.css';

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onSelect: (method: string) => void;
}

export default function PaymentMethodSelector({ selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const paymentGroups = [
    { title: 'E-Wallet', methods: ['GOPAY', 'SHOPEEPAY', 'QRIS'] },
    { title: 'Transfer Bank (Virtual Account)', methods: ['VA_BCA', 'VA_MANDIRI', 'VA_BNI'] },
    { title: 'Gerai Ritel', methods: ['ALFAMART', 'INDOMARET'] }
  ];

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
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>METODE PEMBAYARAN</span>
      </div>
      <div className={styles.paymentBox}>
        {paymentGroups.map(group => (
          <div key={group.title} className={styles.paymentGroup}>
            <div 
              className={styles.groupHeader} 
              onClick={() => setExpandedGroup(expandedGroup === group.title ? null : group.title)}
            >
              <div className={styles.groupInfo}>
                <div className={styles.groupTitle}>{group.title}</div>
                <div className={styles.groupSubtitle}>{group.methods.map(m => getMethodDisplayName(m)).join(', ')}</div>
              </div>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                {expandedGroup === group.title ? (
                  <polyline points="18 15 12 9 6 15"></polyline>
                ) : (
                  <polyline points="6 9 12 15 18 9"></polyline>
                )}
              </svg>
            </div>
            
            {expandedGroup === group.title && (
              <div className={styles.methodsList}>
                {group.methods.map(method => (
                  <div 
                    key={method} 
                    className={`${styles.methodItem} ${selectedMethod === method ? styles.methodSelected : ''}`}
                    onClick={() => onSelect(method)}
                  >
                    <div className={styles.methodIcon}>
                      {getMethodIcon(method) ? (
                        <img src={getMethodIcon(method)!} alt={method} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                          <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                      )}
                    </div>
                    <span className={styles.methodName}>{getMethodDisplayName(method)}</span>
                    <div className={styles.radio}>
                      {selectedMethod === method && <div className={styles.radioInner}></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <div 
          className={`${styles.groupHeader} ${styles.methodItem} ${selectedMethod === 'COD' ? styles.methodSelected : ''}`}
          style={{ marginTop: 8 }}
          onClick={() => onSelect('COD')}
        >
          <div className={styles.groupInfo} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
            <div className={styles.methodIcon} style={{ margin: 0 }}>
              {getMethodIcon('COD') ? (
                <img src={getMethodIcon('COD')!} alt="COD" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              )}
            </div>
            <span className={styles.groupTitle}>{getMethodDisplayName('COD')}</span>
          </div>
          <div className={styles.radio}>
            {selectedMethod === 'COD' && <div className={styles.radioInner}></div>}
          </div>
        </div>
        
        {!selectedMethod && (
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
              Mohon pilih metode pembayaran sebelum melanjutkan pesanan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
