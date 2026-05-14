'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { StatCardSkeleton, TableSkeleton } from '@/components/Skeleton';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    totalVisitors: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    viewCount: number;
    images: string[];
    stockQty: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<DashboardData>('/dashboard');
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Overview XINBIE</p></div>
        </div>
        <div className="page-body">
          <div className="stat-grid">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="data-card" style={{ marginTop: 24, padding: 24 }}>
            <div className="skeleton" style={{ height: 20, width: '200px', marginBottom: 24, borderRadius: 4 }} />
            <TableSkeleton rows={5} columns={3} />
          </div>
        </div>
      </>
    );
  }
  if (!data) return null;

  const { stats, topProducts } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview XINBIE</p>
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          <Link href="/analytics" className="stat-card clickable-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon purple"><span className="material-symbols-outlined">visibility</span></div>
            <div>
              <div className="stat-label">Total Pengunjung</div>
              <div className="stat-value">{stats.totalVisitors}</div>
            </div>
          </Link>
          <Link href="/products" className="stat-card clickable-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon green"><span className="material-symbols-outlined">inventory_2</span></div>
            <div>
              <div className="stat-label">Total Produk</div>
              <div className="stat-value">{stats.totalProducts}</div>
              <div className="stat-change">{stats.activeProducts} produk aktif</div>
            </div>
          </Link>
          <Link href="/categories" className="stat-card clickable-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon blue"><span className="material-symbols-outlined">category</span></div>
            <div>
              <div className="stat-label">Kategori</div>
              <div className="stat-value">{stats.totalCategories}</div>
            </div>
          </Link>
        </div>

        <div className="data-card" style={{ marginTop: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Produk Paling Banyak Dilihat</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Stok</th>
                  <th style={{ textAlign: 'right' }}>Total Dilihat</th>
                </tr>
              </thead>
              <tbody>
                {topProducts && topProducts.length > 0 ? (
                  topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 48, height: 48, borderRadius: 'var(--radius-sm)', 
                            overflow: 'hidden', background: 'var(--divider)',
                            boxShadow: 'var(--shadow-sm)', flexShrink: 0
                          }}>
                            {p.images && p.images.length > 0 ? (
                              <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--text-hint)', fontSize: 20 }}>image</span>
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                        </div>
                      </td>
                      <td><span className="badge blue">{p.stockQty} pcs</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: 15 }}>
                          {p.viewCount.toLocaleString('id-ID')} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>x</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div className="empty-state" style={{ padding: 0 }}>
                        <span className="material-symbols-outlined">visibility_off</span>
                        Belum ada data traffic produk
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
