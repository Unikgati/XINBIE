'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const totalQty = useCartStore((s) => s.totalQuantity());
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [isBumped, setIsBumped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Badge bump animation
  useEffect(() => {
    if (totalQty === 0) return;
    setIsBumped(true);
    const timer = setTimeout(() => setIsBumped(false), 300);
    return () => clearTimeout(timer);
  }, [totalQty]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hiddenRoutes = ['/login', '/register', '/forgot-password', '/otp', '/reset-password'];
  if (hiddenRoutes.includes(pathname)) return null;

  const authed = mounted && isAuthenticated();

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Routes where we want to hide header on mobile to be more "app-like"
  const isAppFlow = 
    pathname.startsWith('/cart') || 
    pathname.startsWith('/checkout') || 
    pathname.startsWith('/payment') || 
    pathname.startsWith('/orders/') || 
    pathname.startsWith('/product/') || 
    pathname.startsWith('/profile');

  return (
    <nav className={`${styles.navbar} ${isAppFlow ? styles.hideOnMobile : ''}`}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Dapur</span>
          <span className={styles.logoHighlight}>gizi</span>
        </Link>

        {/* Search Bar */}
        <form className={styles.searchContainer} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Cari sayur, daging, buah..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
          </button>
        </form>

        {/* Actions */}
        <div className={styles.actionsContainer}>
          {authed && (
            <Link href="/notifications" className={styles.iconButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
              {mounted && unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/cart" className={`${styles.iconButton} ${styles.cartIconButton}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>shopping_cart</span>
            {mounted && totalQty > 0 && (
              <span className={`${styles.badge} ${isBumped ? styles.bump : ''}`}>
                {totalQty > 9 ? '9+' : totalQty}
              </span>
            )}
          </Link>

          {authed && user ? (
            <div className={styles.profileContainer} ref={dropdownRef}>
              <button
                className={styles.avatarButton}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className={styles.avatar} referrerPolicy="no-referrer" />
                ) : (
                  <div className={styles.avatarFallback}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <Link href="/profile" className={styles.dropdownHeader} onClick={() => setDropdownOpen(false)}>
                    <p className={styles.dropdownName}>{user.name}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </Link>
                  <div className={styles.dropdownDivider}></div>
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px' }}>logout</span>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authContainer}>
              <Link href="/login" className={styles.loginButton}>Masuk</Link>
              <Link href="/register" className={styles.registerButton}>Daftar</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
