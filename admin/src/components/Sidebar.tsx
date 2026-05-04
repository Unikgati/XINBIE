'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useNotification } from './NotificationProvider';

const navItems = [
  { section: 'Utama', items: [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/orders', icon: 'shopping_bag', label: 'Pesanan' },
  ]},
  { section: 'Katalog', items: [
    { href: '/categories', icon: 'category', label: 'Kategori' },
    { href: '/products', icon: 'inventory_2', label: 'Produk' },
  ]},
  { section: 'Pengguna', items: [
    { href: '/drivers', icon: 'local_shipping', label: 'Driver' },
    { href: '/withdrawals', icon: 'account_balance_wallet', label: 'Pencairan' },
    { href: '/users', icon: 'group', label: 'Pelanggan' },
  ]},
  { section: 'Marketing', items: [
    { href: '/banners', icon: 'photo_library', label: 'Banner' },
    { href: '/promos', icon: 'sell', label: 'Promo' },
  ]},
  { section: 'Sistem', items: [
    { href: '/delivery-slots', icon: 'event', label: 'Jadwal Pengiriman' },
    { href: '/settings', icon: 'settings', label: 'Pengaturan' },
    { href: '/broadcast', icon: 'campaign', label: 'Broadcast' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { pendingCount, pendingDriversCount, socketStatus } = useNotification();

  const statusDot: Record<string, { color: string; title: string; pulse?: boolean }> = {
    connected: { color: '#4CAF50', title: 'Terhubung' },
    reconnecting: { color: '#FF9800', title: 'Menyambung ulang...', pulse: true },
    disconnected: { color: '#F44336', title: 'Koneksi terputus' },
  };
  const dot = statusDot[socketStatus] || statusDot.disconnected;

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
        <div className="sidebar-logo" style={{ position: 'relative' }}>
          <img src="/logo-icon.svg" alt="Dapur Gizi Logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          <span
            title={dot.title}
            style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 10, height: 10, borderRadius: '50%',
              background: dot.color, border: '2px solid #fff',
              animation: dot.pulse ? 'pulse-dot 1.5s ease-in-out infinite' : undefined,
            }}
          />
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
            {section.items.map((item) => {
              let count = 0;
              if (item.href === '/orders') count = pendingCount;
              if (item.href === '/drivers') count = pendingDriversCount;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  style={{ position: 'relative' }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {count > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: collapsed ? 4 : 12,
                      background: '#F44336',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                      lineHeight: 1,
                      boxShadow: '0 1px 3px rgba(244,67,54,0.4)',
                    }}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              );
            })}
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
        {collapsed ? (
          <span 
            className="material-symbols-outlined" 
            style={{ 
              color: 'var(--text-hint)', 
              cursor: 'pointer',
              fontSize: 22,
              margin: '0 auto',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-hint)'}
            onClick={() => {
              import('@/lib/api').then(({ clearAuthToken }) => {
                clearAuthToken();
                window.location.href = '/login';
              });
            }}
            title="Keluar"
          >
            logout
          </span>
        ) : (
          <>
            <div className="avatar-circle">AD</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Admin</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>admin@dapurgizi.com</div>
            </div>
            <span 
              className="material-symbols-outlined" 
              style={{ color: 'var(--text-hint)', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-hint)'}
              onClick={() => {
                import('@/lib/api').then(({ clearAuthToken }) => {
                  clearAuthToken();
                  window.location.href = '/login';
                });
              }}
              title="Keluar"
            >
              logout
            </span>
          </>
        )}
      </div>
    </aside>
  );
}
