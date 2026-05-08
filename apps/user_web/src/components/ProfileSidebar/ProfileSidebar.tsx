import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './ProfileSidebar.module.css';
import { useAuthStore } from '@/store/authStore';

export default function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar?')) {
      await logout();
      router.push('/login');
    }
  };

  const menuItems = [
    {
      label: 'Profil',
      href: '/profile',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      label: 'Alamat',
      href: '/profile/address',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      )
    },
    {
      label: 'Pesanan',
      href: '/orders',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    }
  ];

  return (
    <div className={styles.sidebar}>
      {/* User Info - Hidden on very small mobile if needed, but here we make it compact */}
      <div className={styles.userInfo}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className={styles.avatar} referrerPolicy="no-referrer" />
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
      
      <div className={styles.menuContainer}>
        <div className={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.menuItem} ${isActive ? styles.menuActive : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            );
          })}
          
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.icon}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span className={styles.label}>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
