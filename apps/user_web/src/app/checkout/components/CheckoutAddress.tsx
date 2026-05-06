'use client';

import React from 'react';
import Link from 'next/link';
import styles from '../page.module.css';
import DgSkeleton from '@/components/DgSkeleton';

interface Address {
  id: string;
  recipientName: string;
  phoneWa: string;
  fullAddress: string;
  isPrimary: boolean;
  province?: { name: string };
  city?: { name: string };
  district?: { name: string };
  village?: { name: string };
}

interface CheckoutAddressProps {
  address: Address | null;
  loading: boolean;
}

export default function CheckoutAddress({ address, loading }: CheckoutAddressProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>ALAMAT PENGIRIMAN</span>
        <Link href="/profile/address" className={styles.addAddressBtn} style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
          Ganti Alamat
        </Link>
      </div>
      <div className={styles.addressBox}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DgSkeleton width="150px" height="20px" />
            <DgSkeleton width="100%" height="16px" />
            <DgSkeleton width="80%" height="16px" />
          </div>
        ) : address ? (
          <>
            <h3 className={styles.recipient}>{address.recipientName}</h3>
            <p className={styles.addressText}>
              {address.fullAddress}<br />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {[
                  address.village?.name,
                  address.district?.name,
                  address.city?.name,
                  address.province?.name
                ].filter(Boolean).join(', ')}
              </span>
            </p>
            <div className={styles.contactRow}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className={styles.contactText}>{address.phoneWa}</span>
            </div>
          </>
        ) : (
          <div className={styles.noAddress}>
            <p className={styles.addressText}>Belum ada alamat pengiriman.</p>
            <Link href="/profile/address" className={styles.addAddressBtn} style={{textDecoration: 'none'}}>
              Tambah Alamat Baru
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
