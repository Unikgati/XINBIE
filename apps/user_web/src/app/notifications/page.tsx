'use client';

import React, { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import styles from './Notifications.module.css';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import DgEmptyState from '@/components/DgEmptyState';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS': return 'shopping_bag';
      case 'PAYMENT': return 'payments';
      case 'PROMO': return 'sell';
      default: return 'notifications';
    }
  };

  const getLink = (notification: any) => {
    if (notification.type === 'ORDER_STATUS' && notification.data?.orderId) {
      return `/orders/${notification.data.orderId}`;
    }
    return null;
  };

  return (
    <div className={`app-container ${styles.container}`}>
      <Breadcrumbs 
        items={[
          { label: 'Beranda', href: '/' },
          { label: 'Notifikasi' }
        ]} 
      />

      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          {notifications.some(n => !n.isRead) && (
            <button className={styles.readAllBtn} onClick={markAllAsRead}>
              Tandai semua dibaca
            </button>
          )}
        </div>

        <div className={styles.list}>
          {loading && notifications.length === 0 && (
            <div className={styles.emptyState}>Memuat notifikasi...</div>
          )}

          {!loading && notifications.length === 0 && (
            <DgEmptyState 
              icon="notifications_off"
              title="Belum ada notifikasi"
              subtitle="Kami akan memberi tahu Anda jika ada update terbaru!"
            />
          )}

          {notifications.map((n) => {
            const link = getLink(n);
            const Content = (
              <div 
                key={n.id} 
                className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                onClick={() => !n.isRead && markAsRead(n.id)}
              >
                <div className={styles.iconWrapper}>
                  <span className="material-symbols-outlined">{getIcon(n.type)}</span>
                </div>
                <div className={styles.content}>
                  <h3 className={styles.title}>{n.title}</h3>
                  <p className={styles.body}>{n.body}</p>
                  <p className={styles.date}>
                    {format(new Date(n.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
                {!n.isRead && <div className={styles.unreadDot} />}
              </div>
            );

            return link ? (
              <Link href={link} key={n.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                {Content}
              </Link>
            ) : Content;
          })}
        </div>
      </div>
    </div>
  );
}
