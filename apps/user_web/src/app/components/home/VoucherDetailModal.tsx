'use client';

import React, { useState } from 'react';
import styles from './VoucherDetailModal.module.css';

interface Voucher {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  endAt?: string;
  maxDiscount?: number;
  allowCod: boolean;
  allowedPaymentMethods: string[];
  categories: any[];
  products: any[];
}

interface VoucherDetailModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherDetailModal({ voucher, isOpen, onClose }: VoucherDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !voucher) return null;

  const formatRp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Detail Voucher</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.ticketBox}>
            <div className={styles.ticketTop}>
              <div className={styles.voucherValue}>
                {voucher.type === 'PERCENT' 
                  ? `Diskon ${voucher.value}%` 
                  : `Potongan Rp ${formatRp(voucher.value)}`
                }
              </div>
              <div className={styles.voucherMinOrder}>Min. Belanja Rp {formatRp(voucher.minOrder)}</div>
            </div>
            <div className={styles.ticketDivider}>
              <div className={styles.notchLeft}></div>
              <div className={styles.notchRight}></div>
            </div>
            <div className={styles.ticketBottom}>
              <div className={styles.codeLabel}>KODE VOUCHER</div>
              <div className={styles.codeWrapper}>
                <span className={styles.codeText}>{voucher.code}</span>
                <button className={styles.copyBtn} onClick={handleCopy}>
                  <span className="material-symbols-outlined">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.sectionHeading}>Syarat & Ketentuan</h4>
            <ul className={styles.termsList}>
              <li>
                <span className="material-symbols-outlined">event_available</span>
                Berlaku hingga {voucher.endAt 
                  ? new Date(voucher.endAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                  : 'Selamanya'}
              </li>
              <li>
                <span className="material-symbols-outlined">shopping_bag</span>
                Minimal transaksi Rp {formatRp(voucher.minOrder)}
              </li>
              {voucher.maxDiscount && voucher.type === 'PERCENT' && (
                <li>
                  <span className="material-symbols-outlined">payments</span>
                  Maksimal potongan Rp {formatRp(voucher.maxDiscount)}
                </li>
              )}
              {voucher.allowedPaymentMethods && voucher.allowedPaymentMethods.length > 0 ? (
                <li style={{ color: '#e67e22', fontWeight: 600 }}>
                  <span className="material-symbols-outlined">credit_card</span>
                  Khusus pembayaran: 
                  <div style={{ display: 'inline-flex', gap: '6px', marginLeft: '8px', verticalAlign: 'middle' }}>
                    {voucher.allowedPaymentMethods.map(m => {
                      const method = m.toLowerCase();
                      const icon = method.startsWith('va_') ? method.replace('va_', '') : (method === 'va' ? 'bca' : method);
                      return <img key={m} src={`/images/payments/${icon}.png`} alt={m} style={{ height: '18px' }} />;
                    })}
                  </div>
                </li>
              ) : !voucher.allowCod && (
                <li style={{ color: '#e67e22', fontWeight: 600 }}>
                  <span className="material-symbols-outlined">no_cash</span>
                  Tidak berlaku untuk metode COD
                </li>
              )}
              {(voucher.categories.length > 0 || voucher.products.length > 0) && (
                <li style={{ color: '#2980b9', fontWeight: 600 }}>
                  <span className="material-symbols-outlined">inventory_2</span>
                  {voucher.categories.length > 0 
                    ? `Hanya untuk kategori: ${voucher.categories.map(c => c.name).join(', ')}`
                    : `Hanya untuk produk spesifik`
                  }
                </li>
              )}
              <li>
                <span className="material-symbols-outlined">info</span>
                Voucher tidak dapat digabungkan dengan promo lainnya
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
