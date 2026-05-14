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
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Alamat Pengiriman</h2>
        </div>
        <Link href="/profile/address" className={styles.sectionAction} style={{ textDecoration: 'none' }}>
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
              <span style={{ fontSize: '12px', color: '#9E9E9E' }}>
                {[
                  address.village?.name,
                  address.district?.name,
                  address.city?.name,
                  address.province?.name
                ].filter(Boolean).join(', ')}
              </span>
            </p>
            <div className={styles.addressDivider}></div>
            <div className={styles.contactRow}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                person
              </span>
              <span className={styles.contactText}>{address.recipientName} - {address.phoneWa}</span>
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
