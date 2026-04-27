'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/Skeleton';
import { apiGet, apiPut } from '@/lib/api';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phoneWa: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface AddressItem {
  id: string;
  recipientName: string;
  phoneWa: string;
  fullAddress: string;
  isPrimary: boolean;
  provinceName?: string;
  cityName?: string;
  districtName?: string;
  villageName?: string;
  lat?: number;
  lng?: number;
}

interface OrderItem {
  id: string;
  code: string;
  orderStatus: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
  itemCount: number;
  isReadAdmin: boolean;
}

interface UserData {
  user: UserDetail;
  stats: Stats;
  addresses: AddressItem[];
  orders: OrderItem[];
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

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const toWaLink = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${cleaned}`;
};

const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<UserData>(`/users/${params.id}`);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async () => {
    if (!data) return;
    const action = data.user.isActive ? 'Nonaktifkan' : 'Aktifkan';
    const ok = await confirm({
      title: `${action} Pelanggan`,
      message: `${action} akun "${data.user.name}"?${data.user.isActive ? ' Pelanggan tidak bisa login setelah dinonaktifkan.' : ''}`,
      confirmLabel: action,
      danger: data.user.isActive,
    });
    if (!ok) return;
    try {
      await apiPut(`/users/${data.user.id}/toggle`, {});
      toast.success(`"${data.user.name}" berhasil di${action.toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div>
              <div className="skeleton" style={{ width: 150, height: 24, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 4 }} />
            </div>
          </div>
        </div>
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
              <div className="data-card" style={{ padding: 24, display: 'flex', gap: 20 }}>
                <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 4, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: 150, height: 14, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
                </div>
              </div>
              <div className="data-card" style={{ padding: 20 }}>
                <TableSkeleton rows={5} columns={5} />
              </div>
            </div>
            <div className="data-card" style={{ padding: 20 }}>
               <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 20 }} />
               {Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} style={{ marginBottom: 16 }}>
                   <div className="skeleton" style={{ width: '40%', height: 16, borderRadius: 4, marginBottom: 8 }} />
                   <div className="skeleton" style={{ width: '100%', height: 14, borderRadius: 4, marginBottom: 6 }} />
                   <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 4 }} />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-hint)' }}>search_off</span>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Pelanggan tidak ditemukan</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => router.push('/users')}>
          <span className="material-symbols-outlined">arrow_back</span> Kembali
        </button>
      </div>
    );
  }

  const { user, stats, addresses, orders } = data;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => router.push('/users')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="page-title">{user.name}</h1>
            <p className="page-subtitle">{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {user.phoneWa && (
            <a
              href={toWaLink(user.phoneWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ color: '#25D366', borderColor: '#25D366' }}
            >
              <WaIcon size={18} /> Chat WhatsApp
            </a>
          )}
          <button
            className={`btn ${user.isActive ? 'btn-outline' : 'btn-primary'}`}
            style={user.isActive ? { color: 'var(--error)', borderColor: 'var(--error)' } : {}}
            onClick={handleToggle}
          >
            <span className="material-symbols-outlined">{user.isActive ? 'person_off' : 'person'}</span>
            {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Profile Card */}
            <div className="data-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--primary-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary)' }}>person</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</span>
                    <span className={`badge ${user.isActive ? 'green' : 'red'}`}>{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{user.email}</div>
                  {user.phoneWa && (
                    <a
                      href={toWaLink(user.phoneWa)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <WaIcon size={16} /> {user.phoneWa}
                    </a>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-hint)' }}>
                  <div>Bergabung</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{fmtDate(user.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="data-card" style={{ marginTop: 0 }}>
              <div className="data-card-header">
                <h3 className="data-card-title">
                  <span className="material-symbols-outlined">receipt_long</span> Riwayat Pesanan
                </h3>
              </div>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined">receipt_long</span>
                  Belum ada pesanan
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => {
                        const s = statusMap[o.orderStatus] || { label: o.orderStatus, badge: 'gray' };
                        return (
                          <tr
                            key={o.id}
                            style={{ cursor: 'pointer', fontWeight: o.isReadAdmin === false ? 600 : 'normal', background: o.isReadAdmin === false ? 'var(--primary-surface, #f0f7ff)' : undefined }}
                            onClick={() => router.push(`/orders/${o.id}`)}
                            title="Klik untuk lihat detail"
                          >
                            <td style={{ fontWeight: 600 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {o.isReadAdmin === false && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary, #2563eb)', display: 'inline-block', flexShrink: 0 }} />}
                                {o.code}
                              </span>
                            </td>
                            <td>{o.itemCount} item</td>
                            <td style={{ fontWeight: 600 }}>{fmt(o.grandTotal)}</td>
                            <td><span className={`badge ${s.badge}`}>{s.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Addresses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="data-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Alamat Tersimpan ({addresses.length})
              </div>
              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-hint)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36 }}>location_off</span>
                  <p style={{ marginTop: 8 }}>Belum ada alamat</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {addresses.map((addr, index) => {
                    const region = [addr.villageName, addr.districtName, addr.cityName, addr.provinceName].filter(Boolean).join(', ');
                    const isLast = index === addresses.length - 1;
                    return (
                      <div
                        key={addr.id}
                        style={{
                          padding: '12px 0',
                          borderBottom: isLast ? 'none' : '1px dashed var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{addr.recipientName}</span>
                          {addr.isPrimary && <span className="badge green" style={{ fontSize: 10 }}>Utama</span>}
                        </div>
                        {region && (
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>{region}</div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600 }}>Alamat:</span> {addr.fullAddress}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 4 }}>{addr.phoneWa}</div>
                        {(addr.lat && addr.lng) && (
                          <div style={{ marginTop: 8 }}>
                            <a
                              href={`https://maps.google.com/?q=${addr.lat},${addr.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pin_drop</span>
                              Buka di Maps
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
