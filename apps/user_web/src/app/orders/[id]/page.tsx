'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function getStatusBadge(status: string) {
  switch (status) {
    case 'WAITING_PAYMENT': return { label: 'Menunggu Pembayaran', icon: '📋' };
    case 'RECEIVED':
    case 'PAID': return { label: 'Pesanan Diterima', icon: '💳' };
    case 'PROCESSING':
    case 'PREPARING': return { label: 'Sedang Disiapkan', icon: '📦' };
    case 'WAITING_DRIVER':
    case 'READY_FOR_DELIVERY': return { label: 'Menunggu Kurir', icon: '🚚' };
    case 'IN_DELIVERY': return { label: 'Sedang Dikirim', icon: '🚚' };
    case 'DELIVERED':
    case 'COMPLETED': return { label: 'Selesai', icon: '✅' };
    case 'CANCELLED': return { label: 'Dibatalkan', icon: '❌' };
    default: return { label: status, icon: '📋' };
  }
}

function getStepIndex(status: string): number {
  switch (status) {
    case 'WAITING_PAYMENT': return 0;
    case 'RECEIVED':
    case 'PAID': return 1;
    case 'PROCESSING':
    case 'PREPARING': return 2;
    case 'WAITING_DRIVER':
    case 'READY_FOR_DELIVERY':
    case 'IN_DELIVERY': return 3;
    case 'DELIVERED':
    case 'COMPLETED': return 4;
    default: return 0;
  }
}

const stepLabels = ['Pesanan', 'Dibayar', 'Disiapkan', 'Dikirim', 'Selesai'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>(`/orders/${orderId}`);
      setOrder(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!confirm('Pesanan yang dibatalkan tidak dapat dikembalikan. Apakah Anda yakin?')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`, {});
      fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pesanan');
    }
  };

  if (loading) return <div className={`app-container ${styles.container}`}><div className={styles.loading}>Memuat detail pesanan...</div></div>;
  if (error || !order) return <div className={`app-container ${styles.container}`}><div className={styles.error}>{error || 'Pesanan tidak ditemukan'}</div></div>;

  const badge = getStatusBadge(order.orderStatus);
  const step = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCELLED';
  const address = order.addressSnapshot;
  const canCancel = ['WAITING_PAYMENT', 'RECEIVED'].includes(order.orderStatus);

  return (
    <div className={`app-container ${styles.container}`}>
      <Link href="/orders" className={styles.backLink}>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Kembali ke Pesanan
      </Link>

      <div className={styles.grid}>
        {/* Left Column */}
        <div>
          {/* Status Card */}
          <div className={styles.statusCard}>
            <h2 className={styles.statusLabel}>
              <span>{badge.icon}</span> {badge.label}
            </h2>

            {!isCancelled && (
              <div className={styles.progressBar}>
                {stepLabels.map((label, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div className={`${styles.stepLine} ${i <= step ? styles.active : ''}`} />}
                    <div className={`${styles.stepIcon} ${i <= step ? styles.active : ''}`} title={label}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        {i === 0 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
                        {i === 1 && <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>}
                        {i === 2 && <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>}
                        {i === 3 && <><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>}
                        {i === 4 && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
                      </svg>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className={styles.statusActions}>
              {canCancel && (
                <button className={styles.cancelBtn} onClick={handleCancel}>Batalkan</button>
              )}
              {order.orderStatus === 'WAITING_PAYMENT' && (
                <Link href={`/payment/${order.id}`} className={styles.payBtn}>
                  Lanjutkan Pembayaran
                </Link>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Daftar Belanja</h3>
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className={styles.itemRow}>
                {item.productSnapshot?.image ? (
                  <img src={item.productSnapshot.image} alt={item.productSnapshot?.name} className={styles.itemImage} />
                ) : (
                  <div className={styles.itemImagePlaceholder}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="#9CA3AF" strokeWidth="2" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>
                    {item.productSnapshot?.name || 'Item'}
                    {item.productSnapshot?.variantName ? ` (${item.productSnapshot.variantName})` : ''}
                  </p>
                  <p className={styles.itemQty}>{item.qty}x @ {formatCurrency(item.unitPrice)}</p>
                </div>
                <p className={styles.itemPrice}>{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}

            <div className={styles.divider} />

            <div className={styles.summaryRow}>
              <p className={styles.summaryLabel}>Subtotal</p>
              <p className={styles.summaryValue}>{formatCurrency(order.subtotal)}</p>
            </div>
            <div className={styles.summaryRow}>
              <p className={styles.summaryLabel}>Ongkos Kirim</p>
              <p className={styles.summaryValue}>{formatCurrency(order.deliveryFee)}</p>
            </div>
            {order.discountAmount > 0 && (
              <div className={styles.summaryRow}>
                <p className={styles.summaryLabel}>Diskon</p>
                <p className={styles.summaryValue} style={{ color: '#059669' }}>-{formatCurrency(order.discountAmount)}</p>
              </div>
            )}

            <div className={styles.divider} />

            <div className={styles.grandTotalRow}>
              <p className={styles.grandTotalLabel}>Grand Total</p>
              <p className={styles.grandTotalValue}>{formatCurrency(order.grandTotal)}</p>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Info) */}
        <div>
          {/* Order Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Informasi Pesanan</h3>
            <div className={styles.infoRow}>
              <p className={styles.infoLabel}>Kode Pesanan</p>
              <p className={styles.infoValue}>
                {order.code}
                <button className={styles.copyBtn} onClick={() => handleCopy(order.code)} title="Salin">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                    {copied ? <><polyline points="20 6 9 17 4 12"/></> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                  </svg>
                </button>
              </p>
            </div>
            <div className={styles.infoRow}>
              <p className={styles.infoLabel}>Tanggal</p>
              <p className={styles.infoValue}>
                {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className={styles.infoRow}>
              <p className={styles.infoLabel}>Pembayaran</p>
              <p className={styles.infoValue}>{order.paymentMethod}</p>
            </div>
            <div className={styles.infoRow}>
              <p className={styles.infoLabel}>Status Bayar</p>
              <p className={styles.infoValue}>{order.paymentStatus}</p>
            </div>
          </div>

          {/* Address */}
          {address && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Alamat Pengiriman</h3>
              <p className={styles.addressName}>{address.recipientName}</p>
              <p className={styles.addressText}>{address.fullAddress}</p>
              {address.province && (
                <p className={styles.addressText} style={{ marginTop: '4px' }}>
                  {[address.village, address.district, address.city, address.province].filter(Boolean).join(', ')}
                </p>
              )}
              {address.notes && (
                <p className={styles.addressText} style={{ marginTop: '8px', color: 'var(--color-primary-dark)', fontStyle: 'italic' }}>
                  Catatan: {address.notes}
                </p>
              )}
            </div>
          )}

          {/* Driver Info */}
          {order.driverName && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Informasi Kurir</h3>
              <div className={styles.infoRow}>
                <p className={styles.infoLabel}>Nama</p>
                <p className={styles.infoValue}>{order.driverName}</p>
              </div>
              {order.driverPhoneWa && (
                <div className={styles.infoRow}>
                  <p className={styles.infoLabel}>WhatsApp</p>
                  <p className={styles.infoValue}>
                    <a href={`https://wa.me/${order.driverPhoneWa}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                      {order.driverPhoneWa}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
