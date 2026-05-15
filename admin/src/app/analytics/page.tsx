'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { apiGet } from '@/lib/api';
import { StatCardSkeleton, TableSkeleton } from '@/components/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  locations: Array<{ city: string; region: string; count: number }>;
  dailyVisitors: Array<{ date: string; visitorCount: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<AnalyticsData>('/analytics');
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat analitik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data) return;
    
    let csv = '\uFEFF'; // BOM for Excel UTF-8 support
    csv += 'LAPORAN ANALITIK PENGUNJUNG XINBIE\n';
    csv += `Tanggal Export: ${new Date().toLocaleString('id-ID')}\n\n`;
    
    csv += 'DATA TRAFFIC HARIAN\n';
    csv += 'Tanggal,Jumlah Pengunjung\n';
    data.dailyVisitors.forEach(v => {
      const d = new Date(v.date);
      const dateStr = isNaN(d.getTime()) ? v.date : d.toLocaleDateString('id-ID');
      csv += `${dateStr},${v.visitorCount}\n`;
    });
    
    csv += '\nDATA PENYEBARAN LOKASI\n';
    csv += 'Kota,Provinsi (ID),Total Hits\n';
    data.locations.forEach(loc => {
      csv += `"${loc.city}","${loc.region}",${loc.count}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `analitik-xinbie-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Laporan CSV berhasil diunduh');
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div><h1 className="page-title">Analitik Pengunjung</h1><p className="page-subtitle">Detail traffic dan lokasi</p></div>
        </div>
        <div className="page-body">
          <div className="stat-grid">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="data-card" style={{ marginBottom: 24, padding: 24 }}>
             <TableSkeleton rows={5} columns={1} />
          </div>
          <div className="data-card" style={{ padding: 24 }}>
             <TableSkeleton rows={10} columns={3} />
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  const hasData = data.dailyVisitors && data.dailyVisitors.length > 0;
  const maxVisitors = hasData ? Math.max(...data.dailyVisitors.map(v => v.visitorCount), 1) : 1;
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analitik Pengunjung</h1>
          <p className="page-subtitle">Wawasan traffic dan demografi lokasi</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={handleExport} disabled={!hasData}>
            <span className="material-symbols-outlined">download</span> Export CSV
          </button>
          <button className="btn btn-primary" onClick={fetchData}>
            <span className="material-symbols-outlined">refresh</span> Refresh Data
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Analytics Grid Styles */}
        <style jsx>{`
          .analytics-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 24px;
          }
          @media (min-width: 1024px) {
            .analytics-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>

        {/* Summary Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon purple"><span className="material-symbols-outlined">analytics</span></div>
            <div>
              <div className="stat-label">Total Traffic (30 Hari)</div>
              <div className="stat-value">
                {data.dailyVisitors.reduce((sum, v) => sum + v.visitorCount, 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><span className="material-symbols-outlined">location_city</span></div>
            <div>
              <div className="stat-label">Top Lokasi</div>
              <div className="stat-value">{data.locations[0]?.city || '-'}</div>
              <div className="stat-change">{data.locations[0]?.count || 0} kunjungan</div>
            </div>
          </div>
        </div>

        {/* Daily Traffic Chart */}
        <div className="data-card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tren Pengunjung Harian</h3>
          </div>
          <div style={{ padding: 24 }}>
            {!hasData ? (
              <div className="empty-state" style={{ height: 300 }}>
                <span className="material-symbols-outlined">query_stats</span>
                Belum ada data traffic harian
              </div>
            ) : (
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.dailyVisitors}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => formatDate(value)}
                      tick={{ fill: 'var(--text-hint)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--divider)' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text-hint)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{ 
                              background: '#fff', 
                              padding: '10px 14px', 
                              border: '1px solid var(--divider)', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }}>
                              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4 }}>
                                {new Date(label).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {payload[0].value} Pengunjung
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="visitorCount" 
                      stroke="var(--primary)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorVisitors)" 
                      activeDot={{ r: 6, fill: 'var(--primary)', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="analytics-grid">
          {/* Top Locations Table */}
          <div className="data-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Penyebaran Lokasi Pengunjung</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table" style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>Kota / Daerah</th>
                    <th>Region</th>
                    <th style={{ textAlign: 'right' }}>Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {data.locations.length > 0 ? (
                    data.locations.map((loc, i) => (
                      <tr key={i}>
                        <td><div style={{ fontWeight: 600 }}>{loc.city}</div></td>
                        <td><span className="badge gray">{loc.region}</span></td>
                        <td style={{ textAlign: 'right' }}>
                           <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{loc.count.toLocaleString('id-ID')}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: 60 }}>
                         <div className="empty-state" style={{ padding: 0 }}>
                            <span className="material-symbols-outlined">map</span>
                            Menunggu data lokasi masuk...
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Status */}
          <div className="data-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Status Tracking</h3>
            </div>
            <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
               <div style={{ 
                 width: 64, height: 64, borderRadius: '50%', background: 'var(--success-surface)', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 
               }}>
                 <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--success)' }}>verified</span>
               </div>
               <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>GeoIP Tracking Aktif</h4>
               <p style={{ color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6, maxWidth: 320 }}>
                 Sistem secara otomatis mendeteksi lokasi setiap pengunjung unik berdasarkan alamat IP mereka menggunakan database lokal yang aman.
               </p>
               <div style={{ marginTop: 24, padding: '12px 20px', background: 'var(--background)', borderRadius: 'var(--radius-md)', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                     <span style={{ color: 'var(--text-hint)' }}>Metode Tracking:</span>
                     <span style={{ fontWeight: 600 }}>Deduplikasi IP Lokal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                     <span style={{ color: 'var(--text-hint)' }}>Status DB:</span>
                     <span style={{ color: 'var(--success)', fontWeight: 600 }}>Operasional</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
