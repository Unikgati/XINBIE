'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const hiddenRoutes = ['/login', '/register', '/forgot-password', '/otp', '/reset-password'];
  if (hiddenRoutes.includes(pathname)) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isAppFlow = 
    pathname.startsWith('/product/') || 
    pathname.startsWith('/resep/');

  return (
    <nav className={`${styles.navbar} ${isAppFlow ? styles.hideOnMobile : ''}`}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="XINBIE" width={130} height={40} className={styles.logoImage} priority />
        </Link>

        {/* Search Bar */}
        <form className={styles.searchContainer} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Cari produk..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            <span className={styles.searchButtonText}>Cari</span>
          </button>
        </form>

        {/* Actions */}
        <div className={styles.actionsContainer}>
        </div>
      </div>
    </nav>
  );
}
