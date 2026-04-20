'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { apiGet } from '@/lib/api';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalDrivers: number;
    totalProducts: number;
    todayOrders: number;
    monthOrders: number;
    monthRevenue: number;
    monthCogs: number;
    grossProfit: number;
    marginPercent: number;
    pendingDrivers: number;
    activeOrders: number;
  };
  recentOrders: {
    id: string;
    code: string;
    userName: string;
    grandTotal: number;
    orderStatus: string;
    createdAt: string;
  }[];
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const statusMap: Record<string, { label: string; badge: string }> = {
  WAITING_PAYMENT: { label: 'Menunggu', badge: 'orange' },
  RECEIVED: { label: 'Diterima', badge: 'blue' },
  PROCESSING: { label: 'Diproses', badge: 'purple' },
  IN_DELIVERY: { label: 'Dikirim', badge: 'green' },
  COMPLETED: { label: 'Selesai', badge: 'green' },
  CANCELLED: { label: 'Batal', badge: 'red' },
};

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

  if (loading) return <div className="loading-center"><div className="spinner" /> Memuat dashboard...</div>;
  if (!data) return null;

  const { stats, recentOrders } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview bisnis Dapur Gizi</p>
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><span className="material-symbols-outlined">payments</span></div>
            <div>
              <div className="stat-label">Revenue Bulan Ini</div>
              <div className="stat-value">{fmt(stats.monthRevenue)}</div>
              <div className="stat-change up">{stats.monthOrders} pesanan bulan ini</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><span className="material-symbols-outlined">trending_up</span></div>
            <div>
              <div className="stat-label">Gross Profit</div>
              <div className="stat-value">{fmt(stats.grossProfit)}</div>
              <div className="stat-change up">Margin {stats.marginPercent}%</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><span className="material-symbols-outlined">shopping_cart</span></div>
            <div>
              <div className="stat-label">Pesanan Hari Ini</div>
              <div className="stat-value">{stats.todayOrders}</div>
              <div className="stat-change">{stats.activeOrders} sedang aktif</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><span className="material-symbols-outlined">group</span></div>
            <div>
              <div className="stat-label">Pelanggan</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-change">{stats.totalDrivers} driver • {stats.totalProducts} produk</div>
            </div>
          </div>
        </div>

        {stats.pendingDrivers > 0 && (
          <div className="alert info" style={{ marginTop: 16 }}>
            <span className="material-symbols-outlined">person_add</span>
            {stats.pendingDrivers} driver menunggu verifikasi
          </div>
        )}

        <div className="data-card" style={{ marginTop: 16 }}>
          <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">receipt_long</span> Pesanan Terbaru</h3></div>
          {recentOrders.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">receipt_long</span>Belum ada pesanan</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Waktu</th></tr></thead>
              <tbody>
                {recentOrders.map(o => {
                  const sm = statusMap[o.orderStatus] || { label: o.orderStatus, badge: 'gray' };
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.code}</td>
                      <td>{o.userName}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(o.grandTotal)}</td>
                      <td><span className={`badge ${sm.badge}`}>{sm.label}</span></td>
                      <td style={{ fontSize: 13 }}>{new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
