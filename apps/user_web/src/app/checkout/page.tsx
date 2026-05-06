'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import { useSnackbarStore } from '@/store/snackbarStore';
import DgSkeleton from '@/components/DgSkeleton';
import Breadcrumbs from '@/components/Breadcrumbs';

import CheckoutAddress from './components/CheckoutAddress';
import CheckoutOrderItems from './components/CheckoutOrderItems';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import CheckoutSchedule from './components/CheckoutSchedule';
import ScheduleModal from './components/ScheduleModal';
import WhatsAppModal from './components/WhatsAppModal';
import VoucherModal from './components/VoucherModal';
import { useAuthStore } from '@/store/authStore';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showWaModal, setShowWaModal] = useState(false);

  // Promo states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Schedule states
  const [scheduledDate, setScheduledDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // Default H+2
    return d;
  });
  const [deliverySlot, setDeliverySlot] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  const user = useAuthStore((s) => s.user);
  
  // States for Address
  const [address, setAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.totalPrice());
  const totalQty = useCartStore((s) => s.totalQuantity());
  const clearCart = useCartStore((s) => s.clearCart);

  const isInstant = deliverySlot?.id === 'INSTANT';
  const deliveryFee = cartItems.length > 0 ? (isInstant ? 10000 : 5000) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const snackbar = useSnackbarStore();

  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'VA_BCA': return 'BCA Virtual Account';
      case 'VA_MANDIRI': return 'Mandiri Virtual Account';
      case 'VA_BNI': return 'BNI Virtual Account';
      case 'COD': return 'Bayar di Tempat (COD)';
      default: return method;
    }
  };

  useEffect(() => {
    setMounted(true);
    // Don't redirect if we are currently processing an order or successfully placed one
    if (cartItems.length === 0 && !loading && !isSuccess) {
      router.replace('/cart');
    } else if (cartItems.length > 0 && !isSuccess) {
      fetchAddress();
    }
  }, [cartItems.length, router, loading, isSuccess]);
  
  // Re-validate promo if payment method changes
  useEffect(() => {
    if (appliedPromo && paymentMethod) {
      handleApplyPromo(appliedPromo.code);
    }
  }, [paymentMethod]);

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

  const handleApplyPromo = async (code?: string) => {
    const codeToUse = code || promoInput;
    if (!codeToUse) return;

    try {
      setIsValidatingPromo(true);
      const res = await api.post<any>('/promos/validate', {
        code: codeToUse,
        subtotal,
        paymentMethod,
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty
        })),
      });

      if (res.isValid) {
        setAppliedPromo(res);
        setDiscountAmount(res.discountAmount);
        setPromoInput(res.code);
        snackbar.show('Promo berhasil digunakan!', 'success');
        setIsVoucherModalOpen(false);
      }
    } catch (err: any) {
      snackbar.show(err.message || 'Kode promo tidak valid', 'error');
      setAppliedPromo(null);
      setDiscountAmount(0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoInput('');
  };

  const handleCheckout = async () => {
    // Get fresh user state from store to avoid closure staleness
    const currentUser = useAuthStore.getState().user;

    if (!paymentMethod) return snackbar.show('Silakan pilih metode pembayaran', 'error');
    if (!address) return snackbar.show('Silakan tambahkan alamat pengiriman', 'error');
    if (!deliverySlot) return snackbar.show('Silakan atur jadwal pengiriman', 'error');

    if (!currentUser?.phoneWa) {
      setShowWaModal(true);
      return;
    }

    try {
      setLoading(true);
      const items = cartItems.map(c => ({
        productId: c.productId,
        variantId: c.variantId || null,
        qty: c.quantity,
      }));

      const orderData = {
        addressId: address.id,
        deliverySlotId: isInstant ? null : deliverySlot.id,
        scheduledDate: isInstant ? null : scheduledDate.toISOString(),
        deliveryType: isInstant ? 'INSTANT' : 'REGULAR',
        paymentMethod: paymentMethod,
        promoCode: appliedPromo?.code || null,
        items,
      };

        const res = await api.post<any>('/orders', orderData);
        
        // Mark as success BEFORE clearing cart to prevent redirect loop
        setIsSuccess(true);
        clearCart();
        
        if (paymentMethod === 'COD') {
          snackbar.show('Pesanan berhasil dibuat! 🎉', 'success');
          router.push('/orders');
        } else {
          router.push(`/payment/${res.id}`);
        }
    } catch (err: any) {
      console.error(err);
      snackbar.show(err.message || 'Gagal membuat pesanan', 'error');
      setLoading(false);
    }
  };

  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (!mounted) {
    return (
      <div className={`app-container ${styles.container}`}>
        <DgSkeleton width="250px" height="32px" borderRadius="8px" />
        <div style={{ height: '32px' }} />
        <div className={styles.contentGrid}>
          <div className={styles.leftCol}>
            <DgSkeleton width="100%" height="150px" borderRadius="16px" />
            <div style={{ height: '24px' }} />
            <DgSkeleton width="100%" height="200px" borderRadius="16px" />
            <div style={{ height: '24px' }} />
            <DgSkeleton width="100%" height="250px" borderRadius="16px" />
          </div>
          <div className={styles.rightCol}>
            <DgSkeleton width="100%" height="300px" borderRadius="24px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${styles.container}`}>
      <Breadcrumbs 
        items={[
          { label: 'Beranda', href: '/' }, 
          { label: 'Keranjang', href: '/cart' }, 
          { label: 'Checkout' }
        ]} 
      />
      <h1 className={styles.pageTitle}>Checkout Pesanan</h1>

      <div className={styles.contentGrid}>
        {/* Left Column: Flow */}
        <div className={styles.leftCol}>
          
          <CheckoutAddress address={address} loading={loadingAddress} />

          <CheckoutSchedule 
            scheduledDate={scheduledDate} 
            deliverySlot={deliverySlot} 
            onTap={() => setIsScheduleModalOpen(true)} 
          />

          <CheckoutOrderItems items={cartItems} totalQty={totalQty} />

          <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />

        </div>

        {/* Right Column: Summary */}
        <div className={styles.rightCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Ringkasan Pesanan</h2>

            <div className={styles.promoBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className={styles.summaryLabel} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Makin Hemat Pakai Promo</div>
                <button 
                  className={styles.voucherPickerBtn} 
                  onClick={() => setIsVoucherModalOpen(true)}
                >
                  Pilih Voucher
                </button>
              </div>
              <div className={styles.promoInputWrapper}>
                <input 
                  type="text" 
                  placeholder="Masukkan kode promo..." 
                  className={styles.promoInput} 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={!!appliedPromo}
                />
                {appliedPromo ? (
                  <button className={styles.promoRemoveBtn} onClick={handleRemovePromo}>Hapus</button>
                ) : (
                  <button 
                    className={styles.promoApplyBtn} 
                    onClick={() => handleApplyPromo()}
                    disabled={isValidatingPromo || !promoInput}
                  >
                    {isValidatingPromo ? '...' : 'Pakai'}
                  </button>
                )}
              </div>
              {appliedPromo && (
                <div className={styles.appliedPromoText}>
                  <span className="material-symbols-outlined">check_circle</span>
                  Promo <b>{appliedPromo.code}</b> berhasil terpasang
                </div>
              )}
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

            {discountAmount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span className={styles.summaryLabel}>Diskon Promo</span>
                <span className={styles.summaryValue}>-Rp {formatRp(discountAmount)}</span>
              </div>
            )}
            
            <div className={styles.summaryDivider}></div>
            
            <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
              <span className={styles.summaryLabel}>Total Belanja</span>
              <span className={styles.summaryValue}>Rp {formatRp(grandTotal)}</span>
            </div>

            <button 
              className={styles.checkoutBtn}
              disabled={!paymentMethod || loading || !address || !deliverySlot}
              onClick={handleCheckout}
            >
              {loading ? 'Memproses...' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className={styles.mobileStickyFooter}>
        <div className={styles.stickyPriceCol}>
          <span className={styles.stickyPriceLabel}>Grand Total</span>
          <span className={styles.stickyPriceValue}>Rp {formatRp(grandTotal)}</span>
        </div>
        <button 
          className={styles.stickyCheckoutBtn}
          disabled={!paymentMethod || loading || !address || !deliverySlot}
          onClick={handleCheckout}
        >
          {loading ? '...' : 'Buat Pesanan'}
        </button>
      </div>

      {showWaModal && (
        <WhatsAppModal 
          onSuccess={() => {
            setShowWaModal(false);
            handleCheckout();
          }} 
          onClose={() => setShowWaModal(false)} 
        />
      )}

      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        initialDate={scheduledDate}
        initialSlot={deliverySlot}
        onConfirm={(date, slot) => {
          setScheduledDate(date);
          setDeliverySlot(slot);
          setIsScheduleModalOpen(false);
        }}
      />

      <VoucherModal 
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        subtotal={subtotal}
        onSelect={(code) => {
          setPromoInput(code);
          handleApplyPromo(code);
        }}
      />
    </div>
  );
}
