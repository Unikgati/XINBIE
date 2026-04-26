'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import { apiGet, apiPut } from '@/lib/api';

type WStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

interface Withdrawal {
  id: string;
  amount: number;
  status: WStatus;
  note: string;
  createdAt: string;
  driver: {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

const statusConfig: Record<WStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Menunggu', color: 'orange', icon: 'hourglass_top' },
  APPROVED: { label: 'Disetujui', color: 'blue', icon: 'check_circle' },
  COMPLETED: { label: 'Selesai', color: 'green', icon: 'verified' },
  REJECTED: { label: 'Ditolak', color: 'red', icon: 'cancel' },
};

export default function WithdrawalsPage() {
  const [activeTab, setActiveTab] = useState<WStatus | 'ALL'>('ALL');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = activeTab !== 'ALL' ? `&status=${activeTab}` : '';
      const res = await apiGet<{ data: Withdrawal[]; meta: { total: number, totalPages?: number } }>(`/withdrawals?limit=20&page=${page}${statusParam}`);
      setWithdrawals(res.data);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data pencairan');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPending = withdrawals.filter(w => w.status === 'PENDING').length;

  const handleAction = async (id: string, action: 'APPROVED' | 'COMPLETED' | 'REJECTED') => {
    const labels: Record<string, { title: string; msg: string; btn: string; danger?: boolean }> = {
      APPROVED: { title: 'Setujui Pencairan', msg: 'Setelah disetujui, Anda harus segera melakukan transfer ke rekening driver.', btn: 'Setujui' },
      COMPLETED: { title: 'Tandai Selesai', msg: 'Pastikan transfer sudah berhasil dikirim ke rekening driver sebelum menandai selesai.', btn: 'Tandai Selesai' },
      REJECTED: { title: 'Tolak Pencairan', msg: 'Saldo akan dikembalikan ke wallet driver. Lanjutkan?', btn: 'Tolak', danger: true },
    };
    const cfg = labels[action];

    const ok = await confirm({ title: cfg.title, message: cfg.msg, confirmLabel: cfg.btn, danger: cfg.danger });
    if (!ok) return;

    try {
      await apiPut(`/withdrawals/${id}`, { action: action === 'APPROVED' ? 'approve' : action === 'COMPLETED' ? 'complete' : 'reject' });
      toast.success(`Pencairan berhasil di-${cfg.btn.toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pencairan');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pencairan Saldo</h1>
          <p className="page-subtitle">{totalPending} permintaan menunggu</p>
        </div>
      </div>
      <div className="page-body">
        <div className="chip-group">
          {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map(tab => (
            <button key={tab} className={`chip ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'ALL' ? 'Semua' : statusConfig[tab].label}
              {tab === 'PENDING' && totalPending > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--error)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>
                  {totalPending}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : withdrawals.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              Belum ada permintaan pencairan
            </div>
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Jumlah</th>
                  <th>Rekening Tujuan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => {
                  const sc = statusConfig[w.status];
                  return (
                    <tr key={w.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{w.driver.name}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Rp {w.amount.toLocaleString('id-ID')}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{w.driver.bankName} • {w.driver.accountNumber}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>a/n {w.driver.accountHolder}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <span className={`badge ${sc.color}`}>
                          <span className="material-symbols-outlined">{sc.icon}</span> {sc.label}
                        </span>
                      </td>
                      <td>
                        <ActionMenu items={
                          w.status === 'PENDING' ? [
                            { icon: 'check_circle', label: 'Setujui & Transfer', onClick: () => handleAction(w.id, 'APPROVED') },
                            { icon: 'cancel', label: 'Tolak', onClick: () => handleAction(w.id, 'REJECTED'), danger: true },
                          ] : w.status === 'APPROVED' ? [
                            { icon: 'verified', label: 'Tandai Selesai', onClick: () => handleAction(w.id, 'COMPLETED') },
                            { icon: 'cancel', label: 'Tolak', onClick: () => handleAction(w.id, 'REJECTED'), danger: true },
                          ] : [
                            { icon: 'visibility', label: 'Lihat Detail', onClick: () => {} },
                          ]
                        } />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
          
          {!loading && withdrawals.length > 0 && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </>
  );
}
