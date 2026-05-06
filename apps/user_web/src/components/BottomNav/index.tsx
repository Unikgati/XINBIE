'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const totalQty = useCartStore((s) => s.totalQuantity());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hiddenRoutes = ['/login', '/register', '/forgot-password', '/otp', '/reset-password', '/checkout'];
  if (hiddenRoutes.includes(pathname)) return null;
  // Note: also hiding on /product/[id] because product detail has its own sticky bottom bar
  if (pathname.startsWith('/product/')) return null;

  const authed = mounted && isAuthenticated();

  const navItems = [
    { name: 'Beranda', path: '/', icon: 'home' },
    { name: 'Keranjang', path: '/cart', icon: 'shopping_cart', badge: mounted && totalQty > 0 ? totalQty : 0 },
    { name: 'Pesanan', path: '/orders', icon: 'receipt_long', authRequired: true },
    { name: 'Profil', path: '/profile', icon: 'person', authRequired: true },
  ];

  return (
    <div className={styles.bottomNavWrapper}>
      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.authRequired && !authed ? '/login' : item.path} 
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={`material-symbols-outlined ${styles.navIcon}`}>
                {item.icon}
              </span>
              <span className={styles.navLabel}>{item.name}</span>
              {item.badge ? (
                <span className={styles.badge}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
