'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import { useNotification } from '@/components/NotificationProvider';
import { getSocket } from '@/lib/socket';
import { apiGet, apiPut } from '@/lib/api';

interface Order {
  id: string;
  code: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: number;
  deliveryFee: number;
  isReadAdmin: boolean;
  createdAt: string;
  user: { name: string; phoneWa: string };
  driver: { name: string; phoneWa: string } | null;
  items: any[];
}

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

// Smart filter groups — priority-based for admin workflow
const filterGroups: { key: string; label: string; icon: string; statuses: string | null; color?: string }[] = [
  { key: 'ALL', label: 'Semua', icon: 'list', statuses: null },
  { key: 'ACTION', label: 'Perlu Ditindak', icon: 'priority_high', statuses: 'RECEIVED,PROBLEM', color: '#DC2626' },
  { key: 'PROGRESS', label: 'Diproses', icon: 'pending', statuses: 'PROCESSING,WAITING_DRIVER' },
  { key: 'DELIVERY', label: 'Pengiriman', icon: 'local_shipping', statuses: 'IN_DELIVERY,DELIVERED' },
  { key: 'WAITING', label: 'Menunggu Bayar', icon: 'schedule', statuses: 'WAITING_PAYMENT' },
  { key: 'DONE', label: 'Selesai', icon: 'check_circle', statuses: 'COMPLETED' },
  { key: 'CANCEL', label: 'Batal', icon: 'cancel', statuses: 'CANCELLED' },
];

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

const payMethodLabel: Record<string, string> = {
  'VA_BCA': 'VA BCA', 'VA_BRI': 'VA BRI', 'VA_BNI': 'VA BNI',
  'VA_MANDIRI': 'VA Mandiri', 'VA_PERMATA': 'VA Permata',
  'COD': 'COD', 'TRANSFER': 'Transfer', 'EWALLET': 'E-Wallet', 'QRIS': 'QRIS',
};
const fmtPay = (m: string) => payMethodLabel[m] || m;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const toast = useToast();
  const confirm = useConfirm();
  const { socketStatus } = useNotification();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilter = filterGroups.find(f => f.key === filter);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const statusParam = activeFilter?.statuses ? `&status=${activeFilter.statuses}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await apiGet<{ data: Order[], meta: any }>(`/orders?limit=20&page=${page}${statusParam}${searchParam}`);
      setOrders(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

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

  const handleUpdateStatus = async (id: string, status: string, label: string) => {
    const ok = await confirm({
      title: `Ubah Status ke "${label}"`,
      message: `Yakin ingin mengubah status pesanan ini?`,
      confirmLabel: 'Ya, Ubah',
      danger: status === 'CANCELLED',
    });
    if (!ok) return;
    try {
      await apiPut(`/orders/${id}/status`, { status });
      toast.success(`Status diubah ke "${label}"`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pesanan</h1>
          <p className="page-subtitle">{totalCount} pesanan{activeFilter && activeFilter.key !== 'ALL' ? ` · ${activeFilter.label}` : ''}</p>
        </div>
      </div>
      <div className="page-body">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Cari kode pesanan atau nama pelanggan..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="search-clear" onClick={() => setSearchInput('')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Smart filter chips */}
        <div className="chip-group">
          {filterGroups.map(f => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => { setFilter(f.key); setPage(1); }}
              style={f.color && filter !== f.key ? { borderColor: f.color, color: f.color } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={8} />
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">receipt_long</span>
              {search ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
            </div>
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Kode</th><th>Pelanggan</th><th>Items</th><th>Total</th><th>Pembayaran</th><th>Driver</th><th>Status</th><th style={{ width: 48 }}></th></tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sm = statusMap[o.orderStatus] || { label: o.orderStatus, badge: 'gray' };
                  return (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/orders/${o.id}`)}
                      style={{ cursor: 'pointer', fontWeight: o.isReadAdmin === false ? 600 : 'normal', background: o.isReadAdmin === false ? 'var(--primary-surface, #f0f7ff)' : undefined }}
                      title="Klik untuk lihat detail"
                    >
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {o.isReadAdmin === false && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary, #2563eb)', display: 'inline-block', flexShrink: 0 }} />}
                          {o.code}
                        </span>
                      </td>
                      <td>
                        <div>{o.user?.name || '-'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{o.user?.phoneWa || ''}</div>
                      </td>
                      <td>{o.items?.length || 0} item</td>
                      <td style={{ fontWeight: 700 }}>{fmt(o.grandTotal)}</td>
                      <td><span className="badge gray">{fmtPay(o.paymentMethod)}</span></td>
                      <td>{o.driver?.name || '-'}</td>
                      <td><span className={`badge ${sm.badge}`}>{sm.label}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <ActionMenu items={[
                          { icon: 'visibility', label: 'Lihat Detail', onClick: () => router.push(`/orders/${o.id}`) },
                          ...(o.orderStatus === 'RECEIVED' ? [
                            { icon: 'pending', label: 'Proses', onClick: () => handleUpdateStatus(o.id, 'PROCESSING', 'Diproses') },
                          ] : []),
                          ...(o.orderStatus === 'PROCESSING' ? [
                            { icon: 'local_shipping', label: 'Siap Kirim', onClick: () => handleUpdateStatus(o.id, 'WAITING_DRIVER', 'Tunggu Driver') },
                          ] : []),
                          ...(!['COMPLETED', 'CANCELLED'].includes(o.orderStatus) ? [
                            { icon: 'cancel', label: 'Batalkan', onClick: () => handleUpdateStatus(o.id, 'CANCELLED', 'Batal'), danger: true },
                          ] : []),
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
          
          {!loading && orders.length > 0 && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </>
  );
}
