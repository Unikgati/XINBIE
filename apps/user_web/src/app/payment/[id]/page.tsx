'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';
import { useSnackbarStore } from '@/store/snackbarStore';
import { getSocket } from '@/lib/socket';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const snackbar = useSnackbarStore();

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get<any>(`/orders/${id}`);
      setOrder(res);
      if (res.paymentStatus === 'PAID') {
        setLoading(false);
      }
      return res;
    } catch (err) {
      console.error('Failed to fetch order:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    
    const socket = getSocket();
    if (socket) {
      socket.on('payment:update', (data: { orderId: string, status: string }) => {
        if (data.orderId === id) {
          fetchOrder();
        }
      });
    }

    const interval = setInterval(() => {
      if (order?.paymentStatus !== 'PAID' && order?.orderStatus !== 'CANCELLED') {
        fetchOrder();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('payment:update');
      }
    };
  }, [fetchOrder, order?.paymentStatus, order?.orderStatus, id]);

  const checkStatus = async () => {
    setIsChecking(true);
    const updatedOrder = await fetchOrder();
    setIsChecking(false);
    
    if (updatedOrder?.paymentStatus === 'PAID') {
      snackbar.show('Pembayaran berhasil diterima! 🎉', 'success');
    } else {
      snackbar.show('Pembayaran belum diterima. Silakan selesaikan pembayaran Anda.', 'info');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getLogoAsset = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('bca')) return '/images/payments/bca.png';
    if (m.includes('mandiri')) return '/images/payments/mandiri.png';
    if (m.includes('bni')) return '/images/payments/bni.png';
    if (m.includes('bri')) return '/images/payments/bri.png';
    if (m.includes('permata')) return '/images/payments/permata.png';
    if (m.includes('cimb')) return '/images/payments/cimb.png';
    if (m.includes('gopay')) return '/images/payments/gopay.png';
    if (m.includes('shopeepay')) return '/images/payments/shopeepay.png';
    if (m.includes('qris')) return '/images/payments/qris.png';
    if (m.includes('alfamart')) return '/images/payments/alfamart.png';
    if (m.includes('indomaret')) return '/images/payments/indomaret.png';
    return null;
  };

  const getMethodName = (method: string) => {
    const m = method.toUpperCase();
    if (m.includes('VA_BCA')) return 'BCA Virtual Account';
    if (m.includes('VA_MANDIRI')) return 'Mandiri Virtual Account';
    if (m.includes('VA_BNI')) return 'BNI Virtual Account';
    if (m.includes('VA_BRI')) return 'BRI Virtual Account';
    if (m.includes('VA_PERMATA')) return 'Permata Virtual Account';
    if (m.includes('VA_CIMB')) return 'CIMB Virtual Account';
    if (m === 'GOPAY') return 'GoPay';
    if (m === 'SHOPEEPAY') return 'ShopeePay';
    if (m === 'QRIS') return 'QRIS';
    if (m === 'ALFAMART') return 'Alfamart';
    if (m === 'INDOMARET') return 'Indomaret';
    return method;
  };

  const getInstructions = (method: string) => {
    const m = method.toUpperCase();
    if (m.startsWith('VA_') || m === 'VA') {
      const bank = getMethodName(method).replace(' Virtual Account', '');
      return [
        `Buka aplikasi M-Banking atau ATM ${bank}.`,
        'Pilih menu Transfer > Virtual Account.',
        'Masukkan nomor Virtual Account yang tertera.',
        'Masukkan jumlah pembayaran sesuai tagihan.',
        'Konfirmasi dan selesaikan pembayaran.',
        'Status pesanan akan berubah otomatis setelah dibayar.'
      ];
    }
    if (m === 'GOPAY' || m === 'SHOPEEPAY' || m === 'QRIS') {
      return [
        'Scan QR Code menggunakan aplikasi E-Wallet Anda.',
        'Periksa jumlah tagihan yang muncul.',
        'Klik Bayar dan masukkan PIN Anda.',
        'Tunggu hingga konfirmasi pembayaran muncul.',
        'Status pesanan akan berubah otomatis.'
      ];
    }
    if (m === 'ALFAMART' || m === 'INDOMARET') {
      return [
        'Kunjungi gerai terdekat.',
        'Beritahu kasir untuk bayar Midtrans.',
        'Tunjukkan kode pembayaran di atas.',
        'Bayar sesuai jumlah tagihan.',
        'Simpan struk pembayaran Anda.'
      ];
    }
    return ['Selesaikan pembayaran sesuai instruksi pada aplikasi.'];
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Memuat data pembayaran...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          <h2>Pesanan tidak ditemukan</h2>
          <p>Maaf, kami tidak dapat menemukan data pembayaran untuk ID ini.</p>
          <Link href="/orders" className={styles.primaryBtn}>Ke Daftar Pesanan</Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';
  const isFailed = order.paymentStatus === 'FAILED' || order.orderStatus === 'CANCELLED';
  const details = order.paymentDetails;
  const paymentMethod = order.paymentMethod;
  const paymentType = order.midtransPaymentType || '';

  let vaNumber = '';
  let qrUrl = '';
  let paymentCode = '';
  let deepLinkUrl = '';

  if (details) {
    if (paymentType === 'bank_transfer' || paymentType === 'echannel') {
      if (details.va_numbers && details.va_numbers.length > 0) {
        vaNumber = details.va_numbers[0].va_number;
      } else if (details.permata_va_number) {
        vaNumber = details.permata_va_number;
      } else if (details.bill_key) {
        vaNumber = `${details.biller_code} - ${details.bill_key}`;
      }
    } else if (['gopay', 'qris', 'shopeepay'].includes(paymentType)) {
      if (details.actions) {
        const qrAction = details.actions.find((a: any) => a.name === 'generate-qr-code');
        if (qrAction) qrUrl = qrAction.url;
        const dlAction = details.actions.find((a: any) => a.name === 'deeplink-redirect' || a.name === 'mobile-web');
        if (dlAction) deepLinkUrl = dlAction.url;
      }
    } else if (paymentType === 'cstore') {
      paymentCode = details.payment_code;
    }
  }

  const formatRp = (n: number) => n.toLocaleString('id-ID');
  const logo = getLogoAsset(paymentMethod);
  const instructions = getInstructions(paymentMethod);

  return (
    <main className={styles.main}>
      <div className={`app-container ${styles.container}`}>
        <Breadcrumbs 
          items={[
            { label: 'Beranda', href: '/' }, 
            { label: 'Pesanan Saya', href: '/orders' }, 
            { label: 'Pembayaran' }
          ]} 
        />
        {/* Progress Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              {isPaid ? 'Pembayaran Berhasil' : isFailed ? 'Pembayaran Gagal' : 'Menyelesaikan Pembayaran'}
            </h1>
            <p className={styles.orderCode}>Order #{order.code}</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Main Content */}
          <div className={styles.content}>
            {isPaid ? (
              <div className={styles.successCard}>
                <div className={styles.successIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2>Yeay! Pembayaran Berhasil</h2>
                <p>Terima kasih telah berbelanja di Dapurgizi. Pesanan Anda akan segera kami proses.</p>
                <div className={styles.successActions}>
                  <Link href="/orders" className={styles.primaryBtn}>Lihat Status Pesanan</Link>
                  <Link href="/" className={styles.secondaryBtn}>Belanja Lagi</Link>
                </div>
              </div>
            ) : isFailed ? (
              <div className={styles.errorCard}>
                <div className={styles.errorIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </div>
                <h2>Oops! Pembayaran Gagal</h2>
                <p>Pembayaran Anda tidak dapat kami proses atau telah kadaluarsa.</p>
                <Link href="/checkout" className={styles.primaryBtn}>Coba Checkout Lagi</Link>
              </div>
            ) : (
              <>
                {/* Payment Method Card */}
                <div className={styles.paymentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.methodInfo}>
                      {logo && <Image src={logo} alt={paymentMethod} width={64} height={32} className={styles.methodLogo} />}
                      <div>
                        <h3>{getMethodName(paymentMethod)}</h3>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    {vaNumber && (
                      <div className={styles.paymentCodeArea}>
                        <label>Nomor Virtual Account</label>
                        <div className={styles.codeRow}>
                          <span className={styles.code}>{vaNumber}</span>
                          <button onClick={() => copyToClipboard(vaNumber)} className={styles.copyIconButton} title="Salin">
                            {isCopied ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {paymentCode && (
                      <div className={styles.paymentCodeArea}>
                        <label>Kode Pembayaran</label>
                        <div className={styles.codeRow}>
                          <span className={styles.code}>{paymentCode}</span>
                          <button onClick={() => copyToClipboard(paymentCode)} className={styles.copyIconButton} title="Salin">
                            {isCopied ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {qrUrl && (
                      <div className={styles.qrArea}>
                        <div className={styles.qrWrapper}>
                          <Image src={qrUrl} alt="QR Code" width={240} height={240} unoptimized />
                        </div>
                        <p>Scan QR Code di atas menggunakan aplikasi e-wallet Anda</p>
                      </div>
                    )}

                    {deepLinkUrl && (
                      <a href={deepLinkUrl} target="_blank" rel="noopener noreferrer" className={styles.deeplinkBtn}>
                        Bayar Sekarang via Aplikasi
                      </a>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className={styles.instructions}>
                  <h3>Instruksi Pembayaran</h3>
                  <div className={styles.steps}>
                    {instructions.map((step, i) => (
                      <div key={i} className={styles.step}>
                        <span className={styles.stepNum}>{i + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar Summary */}
          <aside className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <h3>Ringkasan Tagihan</h3>
              <div className={styles.summaryRows}>
                <div className={styles.row}>
                  <span>Subtotal</span>
                  <span>Rp {formatRp(order.subtotal)}</span>
                </div>
                <div className={styles.row}>
                  <span>Ongkos Kirim</span>
                  <span>Rp {formatRp(order.deliveryFee)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className={`${styles.row} ${styles.discount}`}>
                    <span>Diskon Promo</span>
                    <span>-Rp {formatRp(order.discountAmount)}</span>
                  </div>
                )}
                <div className={styles.divider}></div>
                <div className={`${styles.row} ${styles.totalRow}`}>
                  <span>Total Bayar</span>
                  <span>Rp {formatRp(order.grandTotal)}</span>
                </div>
              </div>

              {!isPaid && !isFailed && (
                <button 
                  className={styles.checkBtn} 
                  onClick={checkStatus} 
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <div className={styles.btnLoading}>
                      <div className={styles.miniSpinner}></div>
                      Memverifikasi...
                    </div>
                  ) : 'Cek Status Pembayaran'}
                </button>
              )}

              <div className={styles.infoBox}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#64748b' }}>info</span>
                <p>Status pembayaran akan terupdate secara otomatis dalam hitungan detik setelah transaksi berhasil.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
