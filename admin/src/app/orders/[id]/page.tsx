'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiGet, apiPut } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useNotification } from '@/components/NotificationProvider';

interface OrderItem {
  id: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot: {
    name: string;
    price: number;
    discountPrice?: number;
    unit: string;
    image?: string;
    variantName?: string;
  };
}

interface StatusLog {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  code: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryType: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  addressSnapshot: {
    recipientName: string;
    phoneWa: string;
    fullAddress: string;
    notes?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
  };
  user: { id: string; name: string; email: string; phoneWa: string };
  driver?: { id: string; name: string; phoneWa: string };
  deliverySlot?: { day: string; startTime: string; endTime: string };
  scheduledDate?: string;
  items: OrderItem[];
  statusLogs: StatusLog[];
  isReadAdmin: boolean;
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

const paymentStatusMap: Record<string, { label: string; badge: string }> = {
  PENDING: { label: 'Belum Bayar', badge: 'orange' },
  PAID: { label: 'Sudah Bayar', badge: 'green' },
  FAILED: { label: 'Gagal', badge: 'red' },
  REFUNDED: { label: 'Refund', badge: 'purple' },
};

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const toWaLink = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${cleaned}`;
};

const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const WaLink = ({ phone }: { phone: string }) => (
  <a
    href={toWaLink(phone)}
    target="_blank"
    rel="noopener noreferrer"
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
    title={`Chat WhatsApp ${phone}`}
  >
    <WaIcon size={16} /> {phone}
  </a>
);

const payMethodLabel: Record<string, string> = {
  'VA_BCA': 'Virtual Account BCA',
  'VA_BRI': 'Virtual Account BRI',
  'VA_BNI': 'Virtual Account BNI',
  'VA_MANDIRI': 'Virtual Account Mandiri',
  'VA_PERMATA': 'Virtual Account Permata',
  'COD': 'Bayar di Tempat (COD)',
  'TRANSFER': 'Transfer Bank',
  'EWALLET': 'E-Wallet',
  'QRIS': 'QRIS',
};
const fmtPayMethod = (m: string) => payMethodLabel[m] || m;

const payMethodLogo: Record<string, string> = {
  'VA_BCA': '/payments/bca.png',
  'VA_BRI': '/payments/bri.png',
  'VA_BNI': '/payments/bni.png',
  'VA_MANDIRI': '/payments/mandiri.png',
  'VA_PERMATA': '/payments/permata.png',
  'VA_CIMB': '/payments/cimb.png',
  'GOPAY': '/payments/gopay.png',
  'OVO': '/payments/ovo.png',
  'DANA': '/payments/dana.png',
  'SHOPEEPAY': '/payments/shopeepay.png',
  'QRIS': '/payments/qris.png',
  'ALFAMART': '/payments/alfamart.png',
  'INDOMARET': '/payments/indomaret.png',
  'COD': '/payments/cod.png',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { decrementPendingCount } = useNotification();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<OrderDetail>(`/orders/${params.id}`);
      setOrder(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Mark as read when order is loaded
  useEffect(() => {
    if (order && order.isReadAdmin === false) {
      apiPut(`/orders/${params.id}/read`)
        .then(() => {
          decrementPendingCount();
          setOrder(prev => prev ? { ...prev, isReadAdmin: true } : prev);
        })
        .catch(() => {}); // silent fail
    }
  }, [order?.id, order?.isReadAdmin, params.id, decrementPendingCount]);

  // Realtime: refresh when status changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = (data: any) => {
      if (data.orderId === params.id) fetchOrder();
    };
    socket.on('order:statusUpdate', onUpdate);
    return () => { socket.off('order:statusUpdate', onUpdate); };
  }, [fetchOrder, params.id]);

  const handleUpdateStatus = async (status: string, label: string) => {
    const ok = await confirm({
      title: `Ubah Status ke "${label}"`,
      message: `Yakin ingin mengubah status pesanan ini?`,
      confirmLabel: 'Ya, Ubah',
      danger: status === 'CANCELLED',
    });
    if (!ok) return;
    try {
      await apiPut(`/orders/${params.id}/status`, { status });
      toast.success(`Status diubah ke "${label}"`);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const handlePrintInvoice = () => {
    if (!order) return;
    const sm = statusMap[order.orderStatus] || { label: order.orderStatus };

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          <div style="font-weight:600">${item.productSnapshot.name}</div>
          ${item.productSnapshot.variantName ? `<div style="font-size:12px;color:#888">Varian: ${item.productSnapshot.variantName}</div>` : ''}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${fmt(item.unitPrice)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600">${fmt(item.totalPrice)}</td>
      </tr>
    `).join('');

    const methodLabel = fmtPayMethod(order.paymentMethod);

    const logoSvg = `<svg width="36" height="36" viewBox="0 0 178.47 260.31" fill="#fff"><path d="M89.23,260.27v.04C-2.78,260.31,0,171.01,0,171.01v-84.98c91.06,40.23,89.22,128.2,89.22,128.2h.01s-1.84-87.98,89.22-128.2v84.98s2.79,89.3-89.22,89.3v-.04Z"/><path d="M89.23,114.35v.03c-60.39,0-58.55-58.6-58.55-58.6V0c59.76,26.4,58.55,84.14,58.55,84.14h0s-1.21-57.74,58.55-84.14v55.77s1.83,58.6-58.55,58.6v-.03Z"/></svg>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.code} - DapurGizi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color:#212121; padding:40px; max-width:800px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #2E7D32; }
    .brand { display:flex; align-items:center; gap:12px; }
    .brand-icon { width:48px; height:48px; background:#2E7D32; border-radius:12px; display:flex; align-items:center; justify-content:center; }
    .brand h1 { font-size:22px; color:#2E7D32; margin-bottom:2px; }
    .brand p { font-size:12px; color:#888; }
    .invoice-info { text-align:right; }
    .invoice-info h2 { font-size:20px; color:#333; margin-bottom:8px; }
    .invoice-info .code { font-size:16px; font-weight:700; color:#2E7D32; }
    .invoice-info .date { font-size:13px; color:#888; margin-top:4px; }
    .info-row { display:flex; gap:24px; margin-bottom:20px; font-size:13px; color:#555; }
    .info-row span { font-weight:600; color:#333; }
    .two-col { display:flex; gap:32px; margin-bottom:24px; }
    .two-col > div { flex:1; }
    .section-label { font-size:11px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
    .info-name { font-weight:600; font-size:14px; margin-bottom:2px; }
    .info-detail { font-size:13px; color:#555; line-height:1.5; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead th { padding:10px 0; text-align:left; font-size:12px; font-weight:700; color:#888; text-transform:uppercase; border-bottom:2px solid #ddd; }
    thead th:nth-child(2), thead th:nth-child(3), thead th:nth-child(4) { text-align:center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align:right; }
    .summary { margin-left:auto; width:280px; }
    .summary-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
    .summary-row.discount { color:#2E7D32; }
    .summary-total { display:flex; justify-content:space-between; padding:12px 0 0; margin-top:8px; border-top:2px solid #333; font-size:18px; font-weight:700; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #eee; text-align:center; font-size:11px; color:#aaa; }
    @media print {
      body { padding:20px; }
      @page { margin:15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">${logoSvg}</div>
      <div>
        <h1>DapurGizi</h1>
        <p>Makanan Sehat untuk Keluarga</p>
      </div>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <div class="code">${order.code}</div>
      <div class="date">${fmtDate(order.createdAt)}</div>
    </div>
  </div>

  <div class="info-row">
    <div>Status: <span>${sm.label}</span></div>
    <div>Pembayaran: <span>${methodLabel}</span></div>
  </div>

  <div class="two-col">
    <div>
      <div class="section-label">Pelanggan</div>
      <div class="info-name">${order.user.name}</div>
      <div class="info-detail">${order.user.email}</div>
      ${order.user.phoneWa ? `<div class="info-detail">${order.user.phoneWa}</div>` : ''}
    </div>
    <div>
      <div class="section-label">Alamat Pengiriman</div>
      <div class="info-name">${order.addressSnapshot.recipientName}</div>
      <div class="info-detail">${order.addressSnapshot.phoneWa}</div>
      <div class="info-detail">${(() => {
        const hasRegion = !!order.addressSnapshot.province;
        const region = [order.addressSnapshot.village, order.addressSnapshot.district, order.addressSnapshot.city, order.addressSnapshot.province].filter(Boolean).join(', ');
        const catatan = hasRegion ? order.addressSnapshot.fullAddress : order.addressSnapshot.notes;
        return region ? `${region}<br/><i>📌 Catatan: ${catatan || '-'}</i>` : order.addressSnapshot.fullAddress;
      })()}</div>
    </div>
  </div>

  <div class="section-label" style="margin-bottom:12px">Item Pesanan</div>
  <table>
    <thead>
      <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="summary">
    <div class="summary-row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
    <div class="summary-row"><span>Ongkos Kirim</span><span>${fmt(order.deliveryFee)}</span></div>
    ${order.discountAmount > 0 ? `<div class="summary-row discount"><span>Diskon</span><span>-${fmt(order.discountAmount)}</span></div>` : ''}
    <div class="summary-total"><span>Total</span><span>${fmt(order.grandTotal)}</span></div>
  </div>

  <div class="footer">
    <p>Terima kasih telah berbelanja di DapurGizi</p>
    <p style="margin-top:4px">Invoice ini dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error('Popup diblokir browser. Izinkan popup untuk mencetak invoice.');
    }
  };

  if (loading) {
    const Sk = ({ w = '100%', h = 16, r = 6, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) => (
      <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
    );
    return (
      <>
        {/* Header Skeleton */}
        <div className="page-header" style={{ gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sk w={40} h={40} r={10} />
            <div>
              <Sk w={180} h={22} mb={8} />
              <Sk w={140} h={14} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <Sk w={130} h={40} r={10} />
            <Sk w={140} h={40} r={10} />
          </div>
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, alignItems: 'start' }}>
            {/* Left Column Skeleton — Items + Price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="data-card" style={{ padding: 24 }}>
                <Sk w={160} h={18} mb={16} />
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--background)', borderRadius: 12, marginBottom: 10 }}>
                    <Sk w={52} h={52} r={10} />
                    <div style={{ flex: 1 }}>
                      <Sk w="70%" h={14} mb={6} />
                      <Sk w="40%" h={12} />
                    </div>
                    <Sk w={70} h={16} />
                  </div>
                ))}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <Sk w="100%" h={14} mb={10} />
                  <Sk w="100%" h={14} mb={10} />
                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, marginTop: 8 }}>
                    <Sk w="100%" h={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Skeleton — Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Customer */}
              <div className="data-card" style={{ padding: 20 }}>
                <Sk w={80} h={11} mb={12} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Sk w={40} h={40} r={20} />
                  <div style={{ flex: 1 }}>
                    <Sk w="60%" h={14} mb={6} />
                    <Sk w="80%" h={12} />
                  </div>
                </div>
                <Sk w="50%" h={13} />
              </div>

              {/* Address */}
              <div className="data-card" style={{ padding: 20 }}>
                <Sk w={120} h={11} mb={12} />
                <Sk w="70%" h={14} mb={8} />
                <Sk w="100%" h={13} mb={4} />
                <Sk w="90%" h={13} />
              </div>

              {/* Payment */}
              <div className="data-card" style={{ padding: 20 }}>
                <Sk w={90} h={11} mb={12} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Sk w={80} h={24} r={12} />
                  <Sk w={80} h={24} r={12} />
                </div>
                <Sk w="60%" h={13} mb={0} />
              </div>

              {/* Timeline */}
              <div className="data-card" style={{ padding: 20 }}>
                <Sk w={100} h={11} mb={16} />
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <Sk w={10} h={10} r={5} />
                    <div style={{ flex: 1 }}>
                      <Sk w="50%" h={13} mb={4} />
                      <Sk w="30%" h={11} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Pesanan Tidak Ditemukan</h1>
          </div>
        </div>
        <div className="page-body">
          <div className="data-card" style={{ padding: 60, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-hint)' }}>search_off</span>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Pesanan tidak ditemukan atau sudah dihapus.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/orders')}>
              <span className="material-symbols-outlined">arrow_back</span> Kembali ke Pesanan
            </button>
          </div>
        </div>
      </>
    );
  }

  const sm = statusMap[order.orderStatus] || { label: order.orderStatus, badge: 'gray' };
  const ps = paymentStatusMap[order.paymentStatus] || { label: order.paymentStatus, badge: 'gray' };
  const canAct = !['COMPLETED', 'CANCELLED'].includes(order.orderStatus);

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-outline btn-icon"
            onClick={() => router.back()}
            title="Kembali"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {order.code}
              <span className={`badge ${sm.badge}`} style={{ fontSize: 12 }}>
                {sm.label}
              </span>
            </h1>
            <p className="page-subtitle">{fmtDate(order.createdAt)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-outline" onClick={() => handlePrintInvoice()} title="Cetak Invoice">
            <span className="material-symbols-outlined">print</span> Cetak Invoice
          </button>
          {canAct && (
            <>
              {order.orderStatus === 'RECEIVED' && (
                <button className="btn btn-primary" onClick={() => handleUpdateStatus('PROCESSING', 'Diproses')}>
                  <span className="material-symbols-outlined">action_key</span> Proses Pesanan
                </button>
              )}
              {order.orderStatus === 'PROCESSING' && (
                <button className="btn btn-primary" onClick={() => handleUpdateStatus('WAITING_DRIVER', 'Tunggu Driver')}>
                  <span className="material-symbols-outlined">package_2</span> Siap Kirim
                </button>
              )}
              <button
                className="btn btn-outline"
                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={() => handleUpdateStatus('CANCELLED', 'Batal')}
              >
                <span className="material-symbols-outlined">cancel</span> Batalkan
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, alignItems: 'start' }}>

          {/* Left Column — Items + Price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Items Card */}
            <div className="data-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>shopping_bag</span>
                Item Pesanan ({order.items.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--background)', borderRadius: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                      {item.productSnapshot.image ? (
                        <img src={item.productSnapshot.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--text-hint)' }}>image</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productSnapshot.name}</div>
                      {item.productSnapshot.variantName && (
                        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>Varian: {item.productSnapshot.variantName}</div>
                      )}
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {item.qty} × {fmt(item.unitPrice)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {fmt(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ongkos Kirim</span>
                  <span>{fmt(order.deliveryFee)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: 'var(--success)' }}>Diskon</span>
                    <span style={{ color: 'var(--success)' }}>-{fmt(order.discountAmount)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-dark)' }}>{fmt(order.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="data-card" style={{ padding: 20, background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--warning)' }}>sticky_note_2</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>Catatan Pelanggan</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{order.notes}</div>
              </div>
            )}
          </div>

          {/* Right Column — Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Customer */}
            <div className="data-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Pelanggan</div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer' }}
                onClick={() => router.push(`/users/${order.user.id}`)}
                title="Lihat Detail Pelanggan"
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>person</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary)' }}>{order.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.user.email}</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-hint)' }}>chevron_right</span>
              </div>
              {order.user.phoneWa && <WaLink phone={order.user.phoneWa} />}
            </div>

            {/* Address */}
            <div className="data-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Alamat Pengiriman</div>
              <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                {order.addressSnapshot.recipientName}
                <span style={{ color: 'var(--border)' }}>|</span>
                <WaLink phone={order.addressSnapshot.phoneWa} />
              </div>
              {(() => {
                const region = [order.addressSnapshot.village, order.addressSnapshot.district, order.addressSnapshot.city, order.addressSnapshot.province].filter(Boolean).join(', ');
                if (!region) return null;
                return <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 8, lineHeight: 1.5 }}>{region}</div>;
              })()}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>Alamat Lengkap:</span> {order.addressSnapshot.fullAddress}
              </div>
            </div>

            {/* Driver */}
            {order.driver && (
              <div className="data-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Driver</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--info-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--info)', fontSize: 20 }}>local_shipping</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.driver.name}</div>
                    <div style={{ fontSize: 12 }}><WaLink phone={order.driver.phoneWa} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="data-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Pembayaran</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {payMethodLogo[order.paymentMethod] && (
                  <img
                    src={payMethodLogo[order.paymentMethod]}
                    alt={fmtPayMethod(order.paymentMethod)}
                    style={{ height: 24, width: 'auto', objectFit: 'contain', borderRadius: 4 }}
                  />
                )}
                <span className={`badge ${ps.badge}`}>{ps.label}</span>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="data-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Pengiriman</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-secondary)' }}>local_shipping</span>
                {order.deliveryType === 'INSTANT' ? 'Pengiriman Instan' : 'Pengiriman Reguler'}
              </div>
              {order.scheduledDate && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>event</span>
                  {new Date(order.scheduledDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              {order.deliverySlot && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                  {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            {order.statusLogs.length > 0 && (
              <div className="data-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>Riwayat Status</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {order.statusLogs.map((log, i) => {
                    const logSm = statusMap[log.status] || { label: log.status, badge: 'gray' };
                    const isLast = i === order.statusLogs.length - 1;
                    return (
                      <div key={log.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                          <div style={{
                            width: isLast ? 12 : 8,
                            height: isLast ? 12 : 8,
                            borderRadius: '50%',
                            background: isLast ? 'var(--primary)' : 'var(--border)',
                            border: isLast ? '3px solid var(--primary-surface)' : 'none',
                            flexShrink: 0,
                            marginTop: 4,
                          }} />
                          {!isLast && <div style={{ width: 2, flex: 1, background: 'var(--divider)', minHeight: 20 }} />}
                        </div>
                        <div style={{ paddingBottom: isLast ? 0 : 14, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{logSm.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{fmtDateShort(log.createdAt)}</div>
                          {log.note && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{log.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
