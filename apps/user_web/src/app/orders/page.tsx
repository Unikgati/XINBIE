'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileSidebar from '@/components/ProfileSidebar/ProfileSidebar';

function getStatusBadge(status: string) {
  switch (status) {
    case 'WAITING_PAYMENT':
      return { label: 'Menunggu Pembayaran', bg: '#FEF3C7', color: '#D97706' };
    case 'PAID':
      return { label: 'Dibayar', bg: '#D1FAE5', color: '#059669' };
    case 'PREPARING':
      return { label: 'Disiapkan', bg: '#DBEAFE', color: '#2563EB' };
    case 'READY_FOR_DELIVERY':
      return { label: 'Siap Dikirim', bg: '#E0E7FF', color: '#4F46E5' };
    case 'IN_DELIVERY':
      return { label: 'Dikirim', bg: '#FCE7F3', color: '#DB2777' };
    case 'DELIVERED':
      return { label: 'Selesai', bg: '#D1FAE5', color: '#059669' };
    case 'CANCELLED':
      return { label: 'Dibatalkan', bg: '#FEE2E2', color: '#DC2626' };
    default:
      return { label: status, bg: '#F3F4F6', color: '#4B5563' };
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      fetchOrders();
    }
  }, [isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/orders');
      const list = res?.data || res || [];
      const sorted = (Array.isArray(list) ? list : []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };


  if (!user) return null;

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus));
  const historyOrders = orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus));

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <div className={`app-container ${styles.container}`}>
      <Breadcrumbs 
        items={[
          { label: 'Beranda', href: '/' }, 
          { label: 'Profil', href: '/profile' }, 
          { label: 'Pesanan Saya' }
        ]} 
      />
      <div className={styles.profileGrid}>
        
        <ProfileSidebar />

        {/* Main Content */}
        <div className={styles.mainContent}>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'active' ? styles.active : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Dalam Proses
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.active : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Riwayat
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)' }}>
              Memuat pesanan...
            </div>
          ) : displayOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3>{activeTab === 'active' ? 'Belum ada pesanan aktif' : 'Belum ada riwayat pesanan'}</h3>
              <p>Yuk mulai belanja bahan dapur sehat!</p>
              <Link href="/" className={styles.shopBtn}>
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className={styles.orderList}>
              {displayOrders.map(order => {
                const badge = getStatusBadge(order.orderStatus);
                
                return (
                  <div 
                    key={order.id} 
                    className={styles.orderCard}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.orderHeader}>
                      <div className={styles.orderHeaderLeft}>
                        <div className={styles.orderIconWrapper}>
                          <svg className={styles.orderIcon} viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className={styles.orderCode}>Pesanan #{order.code}</h4>
                          <p className={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { 
                              day: 'numeric', month: 'short', year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={styles.badge} style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                    
                    <div className={styles.divider}></div>
                    
                    <div className={styles.orderBody}>
                      <div className={styles.itemSummary}>
                        <p className={styles.itemNames}>
                          {order.items?.map((i: any) => i.productSnapshot?.name || 'Item').join(', ')}
                        </p>
                        <p className={styles.itemCount}>{order.items?.length || 0} produk</p>
                      </div>
                      
                      <div className={styles.orderTotal}>
                        <div className={styles.totalInfo}>
                          <p className={styles.totalLabel}>Total Belanja</p>
                          <p className={styles.totalValue}>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.grandTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
