'use client';

import { useState, useEffect, useCallback } from 'react';
import ActionMenu from '@/components/ActionMenu';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import { apiGet, apiPut } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phoneWa: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ data: User[], meta: any }>(`/users?limit=20&page=${page}`);
      setUsers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (u: User) => {
    const action = u.isActive ? 'Nonaktifkan' : 'Aktifkan';
    const ok = await confirm({
      title: `${action} User`,
      message: `${action} akun "${u.name}"?${u.isActive ? ' User tidak bisa login setelah dinonaktifkan.' : ''}`,
      confirmLabel: action,
      danger: u.isActive,
    });
    if (!ok) return;
    try {
      await apiPut(`/users/${u.id}/toggle`, {});
      toast.success(`"${u.name}" berhasil di${action.toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelanggan</h1>
          <p className="page-subtitle">{users.length} pelanggan terdaftar</p>
        </div>
      </div>
      <div className="page-body">
        <div className="data-card">
          {loading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : users.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">group</span>
              Belum ada pelanggan terdaftar
            </div>
          ) : (
            <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>Email</th><th>WhatsApp</th><th>Bergabung</th><th>Status</th><th style={{ width: 48 }}></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td style={{ fontSize: 13 }}>{u.phoneWa || '-'}</td>
                    <td style={{ fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td><span className={`badge ${u.isActive ? 'green' : 'red'}`}>{u.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <ActionMenu items={[
                        { icon: u.isActive ? 'person_off' : 'person', label: u.isActive ? 'Nonaktifkan' : 'Aktifkan', onClick: () => handleToggle(u), danger: u.isActive },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          
          {!loading && users.length > 0 && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </>
  );
}
