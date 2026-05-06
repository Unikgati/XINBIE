'use client';

import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { api } from '@/lib/api';
import DgSkeleton from '@/components/DgSkeleton';

interface Voucher {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  endAt?: string;
  allowCod: boolean;
  allowedPaymentMethods: string[];
  categories: any[];
  products: any[];
}

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  subtotal: number;
}

export default function VoucherModal({ isOpen, onClose, onSelect, subtotal }: VoucherModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVouchers();
    }
  }, [isOpen]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get<Voucher[]>('/promos/available');
      setVouchers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Pilih Voucher</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className={styles.modalBody} style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DgSkeleton width="100%" height="100px" borderRadius="12px" />
              <DgSkeleton width="100%" height="100px" borderRadius="12px" />
            </div>
          ) : vouchers.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ccc' }}>sell</span>
              <p>Belum ada voucher tersedia untukmu</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vouchers.map(v => {
                const isEligible = subtotal >= v.minOrder;
                return (
                  <div 
                    key={v.id} 
                    className={`${styles.voucherCard} ${!isEligible ? styles.voucherIneligible : ''}`}
                    onClick={() => isEligible && onSelect(v.code)}
                  >
                    <div className={styles.voucherLeft}>
                      <span className="material-symbols-outlined">confirmation_number</span>
                    </div>
                    <div className={styles.voucherRight}>
                      <div className={styles.voucherCode}>{v.code}</div>
                      <div className={styles.voucherName}>
                        Diskon {v.type === 'PERCENT' ? `${v.value}%` : `Rp ${formatRp(v.value)}`}
                      </div>
                      <div className={styles.voucherMin}>Min. Belanja Rp {formatRp(v.minOrder)}</div>
                      {(v.categories.length > 0 || v.products.length > 0) && (
                        <div style={{ fontSize: '10px', color: '#3498db', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>inventory_2</span>
                          {v.categories.length > 0 ? `Kategori: ${v.categories.map(c => c.name).join(', ')}` : 'Produk Khusus'}
                        </div>
                      )}
                      {v.allowedPaymentMethods && v.allowedPaymentMethods.length > 0 ? (
                        <div style={{ fontSize: '10px', color: '#f39c12', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span> {v.allowedPaymentMethods.join(', ')} ONLY
                        </div>
                      ) : !v.allowCod && (
                        <div style={{ fontSize: '10px', color: '#f39c12', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span> NON-COD ONLY
                        </div>
                      )}
                      {!isEligible && (
                        <div className={styles.voucherError}>Belanja kurang Rp {formatRp(v.minOrder - subtotal)} lagi</div>
                      )}
                      {v.endAt && (
                        <div className={styles.voucherExpiry}>Berakhir {new Date(v.endAt).toLocaleDateString('id-ID')}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
