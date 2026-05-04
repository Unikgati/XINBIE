'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import DgQuantitySelector from '@/components/DgQuantitySelector';
import { useCartStore } from '@/store/cartStore';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [validating, setValidating] = useState(true);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  
  const cartItems = useCartStore((s) => s.items);
  const totalQty = useCartStore((s) => s.totalQuantity());
  const totalPrice = useCartStore((s) => s.totalPrice());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const validateCart = useCartStore((s) => s.validateCart);

  useEffect(() => {
    setMounted(true);
    validateCart().then((removed) => {
      if (removed.length > 0) setRemovedItems(removed);
      setValidating(false);
    });
  }, [validateCart]);

  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (!mounted || validating) {
    return <div className={`app-container ${styles.container}`}><div className={styles.loading}>Memuat keranjang...</div></div>;
  }

  return (
    <div className={`app-container ${styles.container}`}>
      {removedItems.length > 0 && (
        <div className={styles.removedNotice}>
          <span className={styles.removedIcon}>⚠️</span>
          <div>
            <strong>Beberapa produk dihapus dari keranjang</strong> karena sudah tidak tersedia:
            <span className={styles.removedList}> {removedItems.join(', ')}</span>
          </div>
          <button className={styles.removedClose} onClick={() => setRemovedItems([])}>✕</button>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Keranjang Kosong</h2>
          <p className={styles.emptySubtitle}>Yuk mulai belanja bahan dapur sehat!</p>
          <Link href="/" className={styles.emptyAction}>Mulai Belanja</Link>
        </div>
      ) : (
        <>
          <h1 className={styles.pageTitle}>Keranjang Belanja</h1>
          
          <div className={styles.contentGrid}>
            <div className={styles.leftCol}>
              <div className={styles.summaryHeader}>
                <span className={styles.itemCount}>{cartItems.length} Produk Tersimpan</span>
                <button className={styles.clearAllBtn} onClick={clearCart}>Hapus Semua</button>
              </div>

              <div className={styles.itemList}>
                {cartItems.map((item, idx) => (
                  <div key={`${item.productId}-${item.variantId || 'base'}-${idx}`} className={styles.cartItem}>
                    <div className={styles.itemImage}>
                      <Image 
                        src={item.imageUrl || '/images/placeholder.png'} 
                        alt={item.name} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        unoptimized
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName} title={item.name}>{item.name}</div>
                      <div className={styles.itemPrice}>Rp {formatRp(item.price)}</div>
                      <div className={styles.itemUnit}>/{item.unit}</div>
                    </div>
                    <div className={styles.itemAction}>
                      <DgQuantitySelector 
                        quantity={item.quantity} 
                        onChanged={(newQty) => updateQuantity(item.productId, newQty, item.variantId)} 
                        compact 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.rightCol}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryTitle}>Ringkasan Belanja</h2>
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Total Harga ({totalQty} barang)</span>
                  <span className={styles.summaryValue}>Rp {formatRp(totalPrice)}</span>
                </div>
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Ongkos Kirim</span>
                  <span className={styles.summaryValue}>Dihitung di Checkout</span>
                </div>
                
                <div className={styles.summaryDivider}></div>
                
                <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
                  <span className={styles.summaryLabel}>Total Belanja</span>
                  <span className={styles.summaryValue}>Rp {formatRp(totalPrice)}</span>
                </div>

                <Link href="/checkout" className={styles.checkoutBtn}>
                  Lanjut ke Checkout
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
