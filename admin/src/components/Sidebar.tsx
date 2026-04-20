'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { section: 'Utama', items: [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/orders', icon: 'shopping_bag', label: 'Pesanan' },
  ]},
  { section: 'Katalog', items: [
    { href: '/products', icon: 'inventory_2', label: 'Produk' },
    { href: '/categories', icon: 'category', label: 'Kategori' },
  ]},
  { section: 'Pengguna', items: [
    { href: '/drivers', icon: 'local_shipping', label: 'Driver' },
    { href: '/users', icon: 'group', label: 'Pelanggan' },
  ]},
  { section: 'Marketing', items: [
    { href: '/banners', icon: 'photo_library', label: 'Banner' },
    { href: '/promos', icon: 'sell', label: 'Promo' },
  ]},
  { section: 'Sistem', items: [
    { href: '/settings', icon: 'settings', label: 'Pengaturan' },
    { href: '/broadcast', icon: 'campaign', label: 'Broadcast' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    document.documentElement.setAttribute('data-sidebar', next ? 'collapsed' : 'expanded');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">eco</span>
        </div>
        {!collapsed && (
          <div>
            <div className="sidebar-title">Dapur Gizi</div>
            <div className="sidebar-subtitle">Admin Panel</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            {!collapsed && <div className="nav-section-label">{section.section}</div>}
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-collapse-btn" onClick={toggle}>
        <span className="material-symbols-outlined">
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
        {!collapsed && <span className="nav-label">Minimize</span>}
      </div>

      <div className="sidebar-footer">
        <div className="avatar-circle">AD</div>
        {!collapsed && (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Admin</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>admin@dapurgizi.com</div>
            </div>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)', cursor: 'pointer' }}>logout</span>
          </>
        )}
      </div>
    </aside>
  );
}
