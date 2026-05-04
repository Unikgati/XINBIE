'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const totalQty = useCartStore((s) => s.totalQuantity());
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => { setMounted(true); }, []);

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

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Dapur</span>
          <span className={styles.logoHighlight}>Gizi</span>
        </Link>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Cari sayur, daging, buah..." 
            className={styles.searchInput} 
          />
          <button className={styles.searchButton}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className={styles.actionsContainer}>
          <Link href="/cart" className={styles.cartButton}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {mounted && totalQty > 0 && (
              <span className={styles.cartBadge}>
                {totalQty > 99 ? '99+' : totalQty}
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
                  <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
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
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
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
