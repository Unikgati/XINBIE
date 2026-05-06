'use client';

import React, { useEffect, useState } from 'react';
import styles from './PromoSection.module.css';
import { api } from '@/lib/api';
import DgSkeleton from '@/components/DgSkeleton';
import VoucherDetailModal from './VoucherDetailModal';
import VoucherCard from '@/components/VoucherCard';

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
            <VoucherCard 
              key={promo.id} 
              voucher={promo as any} 
              onTap={() => handleVoucherClick(promo)} 
            />
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
