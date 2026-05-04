'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './page.module.css';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!mounted || !user) {
    return <div className={`app-container ${styles.container}`}><div className={styles.loading}>Memuat profil...</div></div>;
  }

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
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Lengkap</label>
              <input type="text" className={styles.input} value={user.name} disabled />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} value={user.email} disabled />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Nomor WhatsApp</label>
              <input type="tel" className={styles.input} value={user.phoneWa || 'Belum diatur'} disabled />
            </div>
            
            {/* Future implementation: edit mode toggle */}
            <div className={styles.fullWidth}>
              <button className={styles.saveBtn} onClick={() => alert('Fitur edit profil akan segera hadir!')}>
                Edit Profil
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
