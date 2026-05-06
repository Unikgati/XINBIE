'use client';

import React from 'react';
import Image from 'next/image';
import styles from '../page.module.css';

interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string;
  quantity: number;
}

interface CheckoutOrderItemsProps {
  items: CartItem[];
  totalQty: number;
}

export default function CheckoutOrderItems({ items, totalQty }: CheckoutOrderItemsProps) {
  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>DETAIL PESANAN ({totalQty} Produk)</span>
      </div>
      <div className={styles.orderList}>
        {items.map((item, idx) => (
          <div key={`${item.productId}-${idx}`} className={styles.orderItem}>
            <div className={styles.orderImage}>
              {item.imageUrl ? (
                <Image src={item.imageUrl} fill alt={item.name} style={{ objectFit: 'cover'}} unoptimized />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="#bdbdbd" strokeWidth="1" fill="none">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className={styles.orderDetails}>
              <div className={styles.orderName}>{item.name}</div>
              <div className={styles.orderPrice}>Rp {formatRp(item.price)}</div>
              <div className={styles.orderUnit}>/{item.unit}</div>
            </div>
            <div className={styles.orderQty}>{item.quantity}x</div>
          </div>
        ))}
      </div>
    </section>
  );
}
