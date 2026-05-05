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
    return (
      <div className={`app-container ${styles.container}`}>
        <div className="shimmer shimmer-rounded" style={{ width: '200px', height: '32px', marginBottom: '24px' }}></div>
        <div className={styles.contentGrid}>
          <div className={styles.leftCol}>
            <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '40px', marginBottom: '16px' }}></div>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '16px', marginBottom: '16px' }}>
                <div className="shimmer shimmer-rounded" style={{ width: '100px', height: '100px', borderRadius: '12px' }}></div>
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                  <div className="shimmer shimmer-rounded" style={{ width: '80%', height: '20px' }}></div>
                  <div className="shimmer shimmer-rounded" style={{ width: '40%', height: '16px' }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.rightCol}>
            <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '300px', borderRadius: '16px' }}></div>
          </div>
        </div>
      </div>
    );
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
                      {item.imageUrl ? (
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name} 
                          fill 
                          style={{ objectFit: 'cover' }} 
                          unoptimized
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                          <svg viewBox="0 0 24 24" width="32" height="32" stroke="#bdbdbd" strokeWidth="1" fill="none">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        </div>
                      )}
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
