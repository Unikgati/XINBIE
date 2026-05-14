'use client';

import React, { useState } from 'react';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: string | null;
  onSelect: (method: string) => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  selectedMethod, 
  onSelect 
}: PaymentModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.handle} />
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Pilih Metode Pembayaran</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {paymentGroups.map(group => (
            <div key={group.title} className={styles.paymentGroup}>
              <div 
                className={styles.groupHeader} 
                onClick={() => setExpandedGroup(expandedGroup === group.title ? null : group.title)}
              >
                <div className={styles.groupInfo}>
                  <div className={styles.groupTitle}>{group.title}</div>
                  <div className={styles.groupSubtitle}>
                    {group.methods.map(m => getMethodDisplayName(m)).join(', ')}
                  </div>
                </div>
                <span className={`material-symbols-outlined ${styles.arrowIcon}`}>
                  {expandedGroup === group.title ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              
              {expandedGroup === group.title && (
                <div className={styles.methodsList}>
                  {group.methods.map(method => {
                    const active = selectedMethod === method;
                    return (
                      <div 
                        key={method} 
                        className={`${styles.methodItem} ${active ? styles.methodSelected : ''}`}
                        onClick={() => {
                          onSelect(method);
                          onClose();
                        }}
                      >
                        <div className={styles.methodIcon}>
                          {getMethodIcon(method) ? (
                            <img src={getMethodIcon(method)!} alt={method} />
                          ) : (
                            <span className="material-symbols-outlined">payments</span>
                          )}
                        </div>
                        <span className={styles.methodName}>{getMethodDisplayName(method)}</span>
                        <div className={styles.radio}>
                          {active && <div className={styles.radioInner}></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* COD Separate */}
          <div 
            className={`${styles.methodItem} ${selectedMethod === 'COD' ? styles.methodSelected : ''}`}
            style={{ marginTop: '12px', border: '1px solid #eee' }}
            onClick={() => {
              onSelect('COD');
              onClose();
            }}
          >
            <div className={styles.methodIcon}>
              <img src="/images/payments/cod.png" alt="COD" />
            </div>
            <span className={styles.methodName}>{getMethodDisplayName('COD')}</span>
            <div className={styles.radio}>
              {selectedMethod === 'COD' && <div className={styles.radioInner}></div>}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerHint}>
            Pilih metode pembayaran yang paling nyaman untuk Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
