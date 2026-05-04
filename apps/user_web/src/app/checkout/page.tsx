'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  // States for Address
  const [address, setAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.totalPrice());
  const totalQty = useCartStore((s) => s.totalQuantity());
  const clearCart = useCartStore((s) => s.clearCart);

  const deliveryFee = cartItems.length > 0 ? 10000 : 0;
  const grandTotal = subtotal + deliveryFee;

  const paymentGroups = [
    { title: 'E-Wallet', methods: ['GoPay', 'ShopeePay', 'QRIS'] },
    { title: 'Transfer Bank (Virtual Account)', methods: ['VA_BCA', 'VA_MANDIRI', 'VA_BNI'] },
    { title: 'Gerai Ritel', methods: ['Alfamart', 'Indomaret'] }
  ];

  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'VA_BCA': return 'BCA (VA)';
      case 'VA_MANDIRI': return 'Mandiri (VA)';
      case 'VA_BNI': return 'BNI (VA)';
      case 'COD': return 'Bayar di Tempat (COD)';
      default: return method;
    }
  };

  useEffect(() => {
    setMounted(true);
    if (cartItems.length === 0) {
      router.replace('/cart');
    } else {
      fetchAddress();
    }
  }, [cartItems.length, router]);

  const fetchAddress = async () => {
    try {
      setLoadingAddress(true);
      const res = await api.get<any[]>('/addresses');
      if (res && res.length > 0) {
        const primary = res.find((a: any) => a.isPrimary) || res[0];
        setAddress(primary);
      }
    } catch (err) {
      console.error('Failed to fetch address:', err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!paymentMethod) return alert('Silakan pilih metode pembayaran');
    if (!address) return alert('Silakan tambahkan alamat pengiriman');

    try {
      setLoading(true);
      const items = cartItems.map(c => ({
        productId: c.productId,
        variantId: c.variantId || null,
        qty: c.quantity,
      }));

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 2);

      const orderData = {
        addressId: address.id,
        deliveryType: 'REGULAR',
        scheduledDate: scheduledDate.toISOString(),
        paymentMethod: paymentMethod,
        items,
      };

      await api.post<any>('/order', orderData);
      
      clearCart();
      
      if (paymentMethod === 'COD') {
        alert('Pesanan berhasil dibuat! 🎉');
        router.push('/');
      } else {
        alert(`Pesanan berhasil. Segera lakukan pembayaran via ${getMethodDisplayName(paymentMethod)}`);
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (!mounted) return null;

  return (
    <div className={`app-container ${styles.container}`}>
      <h1 className={styles.pageTitle}>Checkout Pesanan</h1>

      <div className={styles.contentGrid}>
        {/* Left Column: Flow */}
        <div className={styles.leftCol}>
          
          {/* Address */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>ALAMAT PENGIRIMAN</span>
              <Link href="/profile/address" className={styles.addAddressBtn} style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
                Ganti Alamat
              </Link>
            </div>
            <div className={styles.addressBox}>
              {loadingAddress ? (
                <p className={styles.addressText}>Memuat alamat...</p>
              ) : address ? (
                <>
                  <h3 className={styles.recipient}>{address.recipientName}</h3>
                  <p className={styles.addressText}>{address.streetAddress}, {address.village}, {address.district}, {address.city}, {address.province} {address.postalCode}</p>
                  <div className={styles.contactRow}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span className={styles.contactText}>{address.recipientPhone}</span>
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

          {/* Items */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>DETAIL PESANAN ({totalQty} Produk)</span>
            </div>
            <div className={styles.orderList}>
              {cartItems.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className={styles.orderItem}>
                  <div className={styles.orderImage}>
                    <Image src={item.imageUrl || '/images/placeholder.png'} fill alt={item.name} style={{ objectFit: 'cover'}} unoptimized />
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

          {/* Payment Methods */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>METODE PEMBAYARAN</span>
            </div>
            <div className={styles.paymentBox}>
              {paymentGroups.map(group => (
                <div key={group.title} className={styles.paymentGroup}>
                  <div 
                    className={styles.groupHeader} 
                    onClick={() => setExpandedGroup(expandedGroup === group.title ? null : group.title)}
                  >
                    <div className={styles.groupInfo}>
                      <div className={styles.groupTitle}>{group.title}</div>
                      <div className={styles.groupSubtitle}>{group.methods.map(m => getMethodDisplayName(m)).join(', ')}</div>
                    </div>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                      {expandedGroup === group.title ? (
                        <polyline points="18 15 12 9 6 15"></polyline>
                      ) : (
                        <polyline points="6 9 12 15 18 9"></polyline>
                      )}
                    </svg>
                  </div>
                  
                  {expandedGroup === group.title && (
                    <div className={styles.methodsList}>
                      {group.methods.map(method => (
                        <div 
                          key={method} 
                          className={`${styles.methodItem} ${paymentMethod === method ? styles.methodSelected : ''}`}
                          onClick={() => setPaymentMethod(method)}
                        >
                          <div className={styles.methodIcon}>
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                              <line x1="2" y1="10" x2="22" y2="10"></line>
                            </svg>
                          </div>
                          <span className={styles.methodName}>{getMethodDisplayName(method)}</span>
                          <div className={styles.radio}>
                            {paymentMethod === method && <div className={styles.radioInner}></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div 
                className={`${styles.groupHeader} ${styles.methodItem} ${paymentMethod === 'COD' ? styles.methodSelected : ''}`}
                style={{ marginTop: 8 }}
                onClick={() => setPaymentMethod('COD')}
              >
                <div className={styles.groupInfo} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                  <div className={styles.methodIcon} style={{ margin: 0 }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <span className={styles.groupTitle}>{getMethodDisplayName('COD')}</span>
                </div>
                <div className={styles.radio}>
                  {paymentMethod === 'COD' && <div className={styles.radioInner}></div>}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Summary */}
        <div className={styles.rightCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Ringkasan Pesanan</h2>

            <div className={styles.promoBox}>
              <div className={styles.summaryLabel} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Makin Hemat Pakai Promo</div>
              <div className={styles.promoInputWrapper}>
                <input type="text" placeholder="Masukkan kode promo..." className={styles.promoInput} />
                <button className={styles.promoApplyBtn}>Pakai</button>
              </div>
            </div>
            
            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Harga ({totalQty} barang)</span>
              <span className={styles.summaryValue}>Rp {formatRp(subtotal)}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Ongkos Kirim</span>
              <span className={styles.summaryValue}>Rp {formatRp(deliveryFee)}</span>
            </div>
            
            <div className={styles.summaryDivider}></div>
            
            <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
              <span className={styles.summaryLabel}>Total Belanja</span>
              <span className={styles.summaryValue}>Rp {formatRp(grandTotal)}</span>
            </div>

            <button 
              className={styles.checkoutBtn}
              disabled={!paymentMethod || loading || !address}
              onClick={handleCheckout}
            >
              {loading ? 'Memproses...' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
