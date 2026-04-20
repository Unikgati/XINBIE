'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { section: 'Utama', items: [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/orders', icon: '📦', label: 'Pesanan' },
  ]},
  { section: 'Katalog', items: [
    { href: '/products', icon: '🛒', label: 'Produk' },
    { href: '/categories', icon: '📁', label: 'Kategori' },
  ]},
  { section: 'Pengguna', items: [
    { href: '/drivers', icon: '🚗', label: 'Driver' },
    { href: '/users', icon: '👥', label: 'Pelanggan' },
  ]},
  { section: 'Marketing', items: [
    { href: '/banners', icon: '🖼️', label: 'Banner' },
    { href: '/promos', icon: '🏷️', label: 'Promo' },
  ]},
  { section: 'Sistem', items: [
    { href: '/settings', icon: '⚙️', label: 'Pengaturan' },
    { href: '/broadcast', icon: '📢', label: 'Broadcast' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">🌿</div>
        <div>
          <div className="sidebar-title">Dapur Gizi</div>
          <div className="sidebar-subtitle">Admin Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar-circle">AD</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Admin</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>admin@dapurgizi.com</div>
        </div>
      </div>
    </aside>
  );
}
