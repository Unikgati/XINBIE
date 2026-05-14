'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { TableSkeleton, StatCardSkeleton } from '@/components/Skeleton';
import { getSocket } from '@/lib/socket';
import { apiGet } from '@/lib/api';

interface DashboardData {
  stats: {
    todayOrders: number;
    monthOrders: number;
    monthRevenue: number;
    grossProfit: number;
    marginPercent: number;
    activeOrders: number;
  };
  recentOrders: {
    id: string;
    code: string;
    userName: string;
    grandTotal: number;
    orderStatus: string;
    isReadAdmin: boolean;
    createdAt: string;
  }[];
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const statusMap: Record<string, { label: string; badge: string }> = {
  WAITING_PAYMENT: { label: 'Menunggu Bayar', badge: 'orange' },
  RECEIVED: { label: 'Diterima', badge: 'blue' },
  PROCESSING: { label: 'Diproses', badge: 'purple' },
  WAITING_DRIVER: { label: 'Tunggu Driver', badge: 'orange' },
  IN_DELIVERY: { label: 'Dikirim', badge: 'green' },
  DELIVERED: { label: 'Diantar', badge: 'green' },
  COMPLETED: { label: 'Selesai', badge: 'green' },
  CANCELLED: { label: 'Batal', badge: 'red' },
  PROBLEM: { label: 'Masalah', badge: 'orange' },
};

import { useNotification } from '@/components/NotificationProvider';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();
  const { socketStatus } = useNotification();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await apiGet<DashboardData>('/dashboard');
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh when order changes via WebSocket (debounced)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchData(false), 500);
    };

    socket.on('order:new', debouncedRefresh);
    socket.on('order:statusUpdate', debouncedRefresh);
    return () => {
      socket.off('order:new', debouncedRefresh);
      socket.off('order:statusUpdate', debouncedRefresh);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchData, socketStatus]);

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Overview bisnis XINBIE</p></div>
        </div>
        <div className="page-body">
          <div className="stat-grid">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="data-card" style={{ marginTop: 16 }}>
            <div className="data-card-header"><h3 className="data-card-title"><span className="material-symbols-outlined">receipt_long</span> Pesanan Terbaru</h3></div>
            <TableSkeleton rows={5} columns={5} />
          </div>
        </div>
      </>
    );
  }
  if (!data) return null;

  const { stats, recentOrders } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview bisnis XINBIE</p>
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><span className="material-symbols-outlined">payments</span></div>
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
            <div className="stat-icon green"><span className="material-symbols-outlined">shopping_cart</span></div>
            <div>
              <div className="stat-label">Pesanan Hari Ini</div>
              <div className="stat-value">{stats.todayOrders}</div>
              <div className="stat-change">{stats.activeOrders} sedang aktif</div>
            </div>
          </div>


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
                    <tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)} style={{ cursor: 'pointer', fontWeight: o.isReadAdmin === false ? 600 : 'normal', background: o.isReadAdmin === false ? 'var(--primary-surface, #f0f7ff)' : undefined }} title="Klik untuk lihat detail">
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {o.isReadAdmin === false && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary, #2563eb)', display: 'inline-block', flexShrink: 0 }} />}
                          {o.code}
                        </span>
                      </td>
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
