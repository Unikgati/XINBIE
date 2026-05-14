'use client';

import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { api } from '@/lib/api';
import DgSkeleton from '@/components/DgSkeleton';
import VoucherCard from '@/components/VoucherCard';

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map(i => (
                <DgSkeleton key={i} width="100%" height="110px" borderRadius="16px" />
              ))}
            </div>
          ) : vouchers.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ccc' }}>sell</span>
              <p>Belum ada voucher tersedia untukmu</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {vouchers.map(v => {
                const isEligible = subtotal >= v.minOrder;
                return (
                  <VoucherCard 
                    key={v.id} 
                    voucher={v as any} 
                    isEligible={isEligible}
                    onTap={() => onSelect(v.code)}
                    errorMsg={!isEligible ? `Belanja kurang Rp ${formatRp(v.minOrder - subtotal)} lagi` : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
