'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiGet, apiPut } from '@/lib/api';

interface Order {
  id: string;
  code: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: number;
  deliveryFee: number;
  createdAt: string;
  user: { name: string; phoneWa: string };
  driver: { name: string; phoneWa: string } | null;
  items: any[];
}

const statusMap: Record<string, { label: string; badge: string; icon: string }> = {
  WAITING_PAYMENT: { label: 'Menunggu Bayar', badge: 'orange', icon: 'schedule' },
  RECEIVED: { label: 'Diterima', badge: 'blue', icon: 'inbox' },
  PROCESSING: { label: 'Diproses', badge: 'purple', icon: 'pending' },
  WAITING_DRIVER: { label: 'Tunggu Driver', badge: 'orange', icon: 'hail' },
  IN_DELIVERY: { label: 'Dikirim', badge: 'green', icon: 'local_shipping' },
  DELIVERED: { label: 'Diantar', badge: 'green', icon: 'package_2' },
  COMPLETED: { label: 'Selesai', badge: 'green', icon: 'check_circle' },
  CANCELLED: { label: 'Batal', badge: 'red', icon: 'cancel' },
  PROBLEM: { label: 'Masalah', badge: 'orange', icon: 'warning' },
};

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await apiGet<{ data: Order[] }>(`/orders${statusParam}`);
      setOrders(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
          <p className="page-subtitle">{orders.length} pesanan</p>
        </div>
      </div>
      <div className="page-body">
        <div className="chip-group">
          {['ALL', 'WAITING_PAYMENT', 'PROCESSING', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'Semua' : statusMap[s]?.label || s}
            </button>
          ))}
        </div>

        <div className="data-card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /> Memuat pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">receipt_long</span>
              Belum ada pesanan
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Kode</th><th>Pelanggan</th><th>Items</th><th>Total</th><th>Pembayaran</th><th>Driver</th><th>Status</th><th style={{ width: 48 }}></th></tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sm = statusMap[o.orderStatus] || { label: o.orderStatus, badge: 'gray', icon: 'help' };
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.code}</td>
                      <td>
                        <div>{o.user?.name || '-'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{o.user?.phoneWa || ''}</div>
                      </td>
                      <td>{o.items?.length || 0} item</td>
                      <td style={{ fontWeight: 700 }}>{fmt(o.grandTotal)}</td>
                      <td><span className="badge gray">{o.paymentMethod}</span></td>
                      <td>{o.driver?.name || '-'}</td>
                      <td><span className={`badge ${sm.badge}`}><span className="material-symbols-outlined">{sm.icon}</span> {sm.label}</span></td>
                      <td>
                        <ActionMenu items={[
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
          )}
        </div>
      </div>
    </>
  );
}
