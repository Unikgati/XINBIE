'use client';

import React, { useEffect, useState } from 'react';
import styles from './PromoSection.module.css';
import { api } from '@/lib/api';
import DgSkeleton from '@/components/DgSkeleton';
import VoucherDetailModal from './VoucherDetailModal';

interface Promo {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  endAt?: string;
  maxDiscount?: number;
  allowCod: boolean;
  categories: any[];
  products: any[];
}

export default function PromoSection() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Promo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleVoucherClick = (promo: Promo) => {
    setSelectedVoucher(promo);
    setIsModalOpen(true);
  };

  const fetchPromos = async () => {
    try {
      const res = await api.get<Promo[]>('/promos/available');
      setPromos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch promos:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (!loading && promos.length === 0) return null;

  return (
    <section className={styles.promoSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Promo Spesial Untukmu</h2>
      </div>

      <div className={styles.promoGrid}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <DgSkeleton key={i} width="100%" height="160px" borderRadius="16px" />
          ))
        ) : (
          promos.map((promo) => (
            <div 
              key={promo.id} 
              className={styles.voucherCard}
              onClick={() => handleVoucherClick(promo)}
            >
              <span className={`material-symbols-outlined ${styles.voucherIcon}`}>confirmation_number</span>
              <div className={styles.voucherTop}>
                <span className={styles.voucherBadge}>Promo Belanja</span>
                <h3 className={styles.voucherTitle}>
                  {promo.type === 'PERCENT' 
                    ? `Diskon ${promo.value}% (s.d Rp ${formatRp(promo.maxDiscount || 0)})` 
                    : `Potongan Langsung Rp ${formatRp(promo.value)}`
                  }
                </h3>
                <p className={styles.voucherSubtitle}>Min. pembelian Rp {formatRp(promo.minOrder)}</p>
                {(promo.categories.length > 0 || promo.products.length > 0) && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#3498db', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>inventory_2</span>
                    {promo.categories.length > 0 ? `Kategori: ${promo.categories[0].name}${promo.categories.length > 1 ? '...' : ''}` : 'Produk Khusus'}
                  </div>
                )}
                {!promo.allowCod && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#f39c12', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span> NON-COD
                  </div>
                )}
              </div>
              
              <div className={styles.voucherDivider}></div>
              
              <div className={styles.voucherBottom}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                <span>
                  {promo.endAt 
                    ? `Berlaku s.d ${new Date(promo.endAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` 
                    : 'Berlaku selamanya'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <VoucherDetailModal 
        isOpen={isModalOpen} 
        voucher={selectedVoucher as any} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
}
