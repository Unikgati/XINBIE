'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING_PAYMENT':
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
  const logout = useAuthStore((s) => s.logout);
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus));
  const historyOrders = orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus));

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <div className={`app-container ${styles.container}`}>
      <div className={styles.profileGrid}>
        
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className={styles.avatar} style={{borderRadius: '50%'}} />
            ) : (
              <div className={styles.avatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          </div>
          
          <div className={styles.menuList}>
            <Link href="/profile" className={`${styles.menuItem} ${pathname === '/profile' ? styles.menuActive : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profil Saya
            </Link>
            <Link href="/profile/address" className={`${styles.menuItem} ${pathname === '/profile/address' ? styles.menuActive : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Alamat Pengiriman
            </Link>
            <Link href="/orders" className={`${styles.menuItem} ${pathname === '/orders' ? styles.menuActive : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Pesanan Saya
            </Link>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Keluar
            </button>
          </div>
        </div>

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
                const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                const otherItemsCount = (order.items?.length || 0) - 1;
                const itemsTitle = firstItem ? firstItem.productSnapshot?.name || 'Item' : 'Pesanan Kosong';
                const itemsSubtitle = otherItemsCount > 0 ? `dan ${otherItemsCount} barang lainnya` : '';
                const itemImage = firstItem?.productSnapshot?.images?.[0];
                
                return (
                  <Link href={`/orders/${order.id}`} key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderHeaderLeft}>
                        <svg className={styles.orderIcon} viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <div>
                          <p className={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { 
                              day: 'numeric', month: 'short', year: 'numeric' 
                            })}
                          </p>
                          <h4 className={styles.orderCode}>Pesanan #{order.code}</h4>
                        </div>
                      </div>
                      <span className={styles.badge} style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                    
                    <div className={styles.orderBody}>
                      {itemImage ? (
                        <img src={itemImage} alt={itemsTitle} className={styles.itemImage} />
                      ) : (
                        <div className={styles.itemImage} style={{backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="#9CA3AF" strokeWidth="2" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                      )}
                      <div className={styles.itemDetails}>
                        <p className={styles.itemTitle}>{itemsTitle}</p>
                        {itemsSubtitle && <p className={styles.itemSubtitle}>{itemsSubtitle}</p>}
                      </div>
                      
                      <div className={styles.orderFooter}>
                        <div style={{textAlign: 'right'}}>
                          <p className={styles.totalLabel}>Total Belanja</p>
                          <p className={styles.totalValue}>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.grandTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
