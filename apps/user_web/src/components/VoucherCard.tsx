'use client';

import React from 'react';
import styles from './VoucherCard.module.css';

interface Voucher {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  endAt?: string;
  allowCod: boolean;
  allowedPaymentMethods?: string[];
  categories: any[];
  products: any[];
}

interface VoucherCardProps {
  voucher: Voucher;
  onTap?: () => void;
  isEligible?: boolean;
  errorMsg?: string;
}

export default function VoucherCard({ voucher, onTap, isEligible = true, errorMsg }: VoucherCardProps) {
  const formatRp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  const discountLabel = voucher.type === 'PERCENT' 
    ? `Diskon ${voucher.value}% (s.d Rp ${formatRp(voucher.maxDiscount || 0)})` 
    : `Potongan Langsung Rp ${formatRp(voucher.value)}`;

  const getPaymentIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.startsWith('va_')) return `/images/payments/${m.replace('va_', '')}.png`;
    if (m === 'va') return `/images/payments/bca.png`; // Fallback for generic VA
    return `/images/payments/${m}.png`;
  };

  return (
    <div 
      className={`${styles.voucherCard} ${!isEligible ? styles.voucherIneligible : ''}`}
      onClick={() => isEligible && onTap?.()}
    >
      <span className={`material-symbols-outlined ${styles.voucherIcon}`}>confirmation_number</span>
      
      <div className={styles.voucherTop}>
        <span className={styles.voucherBadge}>{voucher.code}</span>
        <h3 className={styles.voucherTitle}>{discountLabel}</h3>
        <p className={styles.voucherSubtitle}>Min. pembelian Rp {formatRp(voucher.minOrder)}</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {(voucher.categories.length > 0 || voucher.products.length > 0) && (
            <div className={styles.infoRow} style={{ color: '#3498db', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>inventory_2</span>
              {voucher.categories.length > 0 
                ? `${voucher.categories[0].name}${voucher.categories.length > 1 ? '...' : ''}` 
                : 'Produk Khusus'}
            </div>
          )}

          {voucher.allowedPaymentMethods && voucher.allowedPaymentMethods.length > 0 ? (
            <div className={styles.infoRow} style={{ color: '#f39c12', margin: 0 }}>
              <span style={{ fontSize: '10px', marginRight: '4px' }}>KHUSUS:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {voucher.allowedPaymentMethods.map(m => (
                  <img key={m} src={getPaymentIcon(m)} alt={m} style={{ height: '14px', objectFit: 'contain' }} />
                ))}
              </div>
            </div>
          ) : !voucher.allowCod && (
            <div className={styles.infoRow} style={{ color: '#f39c12', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span>
              NON-COD
            </div>
          )}
        </div>

        {errorMsg && <div className={styles.errorText}>{errorMsg}</div>}
      </div>
      
      <div className={styles.voucherDivider}></div>
      
      <div className={styles.voucherBottom}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
        <span>
          {voucher.endAt 
            ? `Berlaku s.d ${new Date(voucher.endAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` 
            : 'Berlaku selamanya'}
        </span>
      </div>
    </div>
  );
}
