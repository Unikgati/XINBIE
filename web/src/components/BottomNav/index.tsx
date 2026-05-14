'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  const hiddenRoutes = ['/login', '/register', '/forgot-password', '/otp', '/reset-password'];
  if (hiddenRoutes.includes(pathname)) return null;
  if (pathname.startsWith('/product/')) return null;

  const navItems = [
    { name: 'Beranda', path: '/', icon: 'home' },
    { name: 'Kategori', path: '/category', icon: 'category' },
  ];

  return (
    <div className={styles.bottomNavWrapper}>
      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={`material-symbols-outlined ${styles.navIcon}`}>
                {item.icon}
              </span>
              <span className={styles.navLabel}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
