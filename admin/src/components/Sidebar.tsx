'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">eco</span>
        </div>
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
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar-circle">AD</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Admin</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>admin@dapurgizi.com</div>
        </div>
        <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)', cursor: 'pointer' }}>logout</span>
      </div>
    </aside>
  );
}
