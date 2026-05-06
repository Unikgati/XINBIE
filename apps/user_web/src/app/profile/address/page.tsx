'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import CustomSelect from '@/components/CustomSelect';
import MapPicker from '@/components/MapPicker';
import styles from './page.module.css';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AddressPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    recipientName: '',
    phoneWa: '',
    fullAddress: '',
    provinceId: '',
    cityId: '',
    districtId: '',
    villageId: '',
    lat: null as number | null,
    lng: null as number | null,
    isPrimary: false
  });

  // Region State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      fetchAddresses();
      fetchProvinces();
    }
  }, [isAuthenticated, router]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get<any[]>('/addresses');
      setAddresses(res || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await api.get<any[]>('/regions/provinces');
      const provs = res || [];
      setProvinces(provs);
      
      // Auto-select if only 1 province exists
      if (provs.length === 1 && !formData.provinceId) {
        const id = provs[0].id;
        setFormData(prev => ({ ...prev, provinceId: id }));
        fetchCities(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCities = async (provinceId: string) => {
    try {
      const res = await api.get<any[]>(`/regions/cities?provinceId=${provinceId}`);
      setCities(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDistricts = async (cityId: string) => {
    try {
      const res = await api.get<any[]>(`/regions/districts?cityId=${cityId}`);
      setDistricts(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await api.get<any[]>(`/regions/villages?districtId=${districtId}`);
      setVillages(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleOpenModal = async (address?: any) => {
    if (address) {
      setEditingId(address.id);
      setFormData({
        recipientName: address.recipientName,
        phoneWa: address.phoneWa,
        fullAddress: address.fullAddress,
        provinceId: address.provinceId || '',
        cityId: address.cityId || '',
        districtId: address.districtId || '',
        villageId: address.villageId || '',
        lat: address.lat || null,
        lng: address.lng || null,
        isPrimary: address.isPrimary
      });
      // Prefetch dependencies
      if (address.provinceId) await fetchCities(address.provinceId);
      if (address.cityId) await fetchDistricts(address.cityId);
      if (address.districtId) await fetchVillages(address.districtId);
    } else {
      setEditingId(null);
      setFormData({
        recipientName: '',
        phoneWa: '',
        fullAddress: '',
        provinceId: provinces.length === 1 ? provinces[0].id : '',
        cityId: '',
        districtId: '',
        villageId: '',
        lat: null,
        lng: null,
        isPrimary: addresses.length === 0
      });
      if (provinces.length === 1) {
        await fetchCities(provinces[0].id);
      } else {
        setCities([]);
      }
      setDistricts([]);
      setVillages([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (e.target instanceof HTMLInputElement && type === 'checkbox') {
      checked = e.target.checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle cascading region dropdowns
    if (name === 'provinceId') {
      setFormData(prev => ({ ...prev, cityId: '', districtId: '', villageId: '' }));
      setCities([]); setDistricts([]); setVillages([]);
      if (value) fetchCities(value);
    } else if (name === 'cityId') {
      setFormData(prev => ({ ...prev, districtId: '', villageId: '' }));
      setDistricts([]); setVillages([]);
      if (value) fetchDistricts(value);
    } else if (name === 'districtId') {
      setFormData(prev => ({ ...prev, villageId: '' }));
      setVillages([]);
      if (value) fetchVillages(value);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provinceId || !formData.cityId || !formData.districtId || !formData.villageId) {
      alert("Mohon lengkapi data wilayah (Provinsi s/d Kelurahan)");
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingId) {
        await api.put(`/addresses/${editingId}`, formData);
      } else {
        await api.post('/addresses', formData);
      }
      
      await fetchAddresses();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan alamat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi lokasi.');
      return;
    }

    setIsDetectingLocation(true);

    // Try High Accuracy First
    const tryHighAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          setIsDetectingLocation(false);
        },
        (error) => {
          console.warn('High accuracy failed, falling back...', error);
          tryLowAccuracy();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    // Fallback to Low Accuracy
    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          setIsDetectingLocation(false);
        },
        (error) => {
          console.error('Final Geolocation error:', error.code, error.message);
          setIsDetectingLocation(false);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Izin lokasi ditolak. Mohon izinkan lokasi di pengaturan browser dan sistem (macOS) Anda.');
          } else {
            alert('Gagal mendeteksi lokasi secara otomatis. Mohon gunakan tombol "Pilih Manual di Peta".');
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    tryHighAccuracy();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus alamat ini?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus alamat');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.put(`/addresses/${id}/set-primary`, {});
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Gagal mengatur alamat utama');
    }
  };

  if (!user) return null;

  return (
    <div className={`app-container ${styles.container}`}>
      <Breadcrumbs 
        items={[
          { label: 'Beranda', href: '/' }, 
          { label: 'Profil', href: '/profile' }, 
          { label: 'Alamat Pengiriman' }
        ]} 
      />
      <div className={styles.profileGrid}>
        
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className={styles.avatar} style={{borderRadius: '50%'}} />
            ) : (
              <div className={styles.avatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          </div>
          
          <div className={styles.menuList}>
            <Link href="/profile" className={`${styles.menuItem} ${pathname === '/profile' ? styles.menuActive : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profil Saya
            </Link>
            <Link href="/profile/address" className={`${styles.menuItem} ${pathname === '/profile/address' ? styles.menuActive : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Alamat Pengiriman
            </Link>
            <Link href="/orders" className={`${styles.menuItem} ${pathname === '/orders' ? styles.menuActive : ''}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Pesanan Saya
            </Link>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Keluar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {loading ? (
            <div className={styles.loading}>Memuat alamat...</div>
          ) : addresses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} style={{ width: '64px', height: '64px', color: 'var(--color-text-hint)', margin: '0 auto 16px' }}>
                <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" strokeWidth="1" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-primary)', textAlign: 'center' }}>Belum ada alamat</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
                Kamu belum menambahkan alamat pengiriman.
              </p>
              <div style={{ textAlign: 'center' }}>
                <button className={styles.addBtn} onClick={() => handleOpenModal()} style={{ display: 'inline-block' }}>
                  + Tambah Alamat
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.addressGrid}>
                {addresses.map((address) => (
                  <div key={address.id} className={styles.addressCard}>
                    {address.isPrimary && <span className={styles.primaryBadge}>Utama</span>}
                    
                    <div>
                      <h3 className={styles.recipientName}>{address.recipientName}</h3>
                      <span className={styles.recipientPhone}>{address.phoneWa}</span>
                    </div>
                    
                    <p className={styles.addressText}>
                      {address.fullAddress}
                    </p>

                    <div className={styles.cardActions}>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleOpenModal(address)}>
                        Ubah
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(address.id)}>
                        Hapus
                      </button>
                      {!address.isPrimary && (
                        <button className={`${styles.actionBtn} ${styles.setPrimaryBtn}`} onClick={() => handleSetPrimary(address.id)}>
                          Jadikan Utama
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button className={styles.addBtn} onClick={() => handleOpenModal()} style={{ padding: '12px 32px', borderRadius: '8px', border: '1px dashed var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  + Tambah Alamat Lainnya
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Ubah Alamat' : 'Tambah Alamat Baru'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Penerima</label>
                  <input 
                    type="text" 
                    name="recipientName" 
                    value={formData.recipientName} 
                    onChange={handleChange} 
                    className={styles.input} 
                    placeholder="Masukkan nama penerima"
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    name="phoneWa" 
                    value={formData.phoneWa} 
                    onChange={handleChange} 
                    className={styles.input} 
                    placeholder="Contoh: 081234567890"
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Provinsi</label>
                  <CustomSelect
                    options={provinces.map(p => ({ value: p.id, label: p.name }))}
                    value={formData.provinceId}
                    onChange={(val) => handleChange({ target: { name: 'provinceId', value: val, type: 'text' } } as any)}
                    placeholder="Pilih Provinsi"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Kabupaten / Kota</label>
                  <CustomSelect
                    options={cities.map(c => ({ value: c.id, label: c.name }))}
                    value={formData.cityId}
                    onChange={(val) => handleChange({ target: { name: 'cityId', value: val, type: 'text' } } as any)}
                    placeholder="Pilih Kota"
                    disabled={!formData.provinceId}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Kecamatan</label>
                  <CustomSelect
                    options={districts.map(d => ({ value: d.id, label: d.name }))}
                    value={formData.districtId}
                    onChange={(val) => handleChange({ target: { name: 'districtId', value: val, type: 'text' } } as any)}
                    placeholder="Pilih Kecamatan"
                    disabled={!formData.cityId}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Kelurahan / Desa</label>
                  <CustomSelect
                    options={villages.map(v => ({ value: v.id, label: v.name }))}
                    value={formData.villageId}
                    onChange={(val) => handleChange({ target: { name: 'villageId', value: val, type: 'text' } } as any)}
                    placeholder="Pilih Kelurahan"
                    disabled={!formData.districtId}
                  />
                </div>
                
                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{marginTop: '8px'}}>
                  <label className={styles.label}>Alamat Lengkap</label>
                  <textarea 
                    name="fullAddress" 
                    value={formData.fullAddress} 
                    onChange={handleChange} 
                    className={styles.textarea} 
                    placeholder="Cth: Jl. Raya No.1, RT/RW, Patokan"
                    required 
                  />
                </div>

                {/* GPS Location Block */}
                <div className={`${styles.formGroup} ${styles.fullWidth} ${styles.gpsBlock}`}>
                  <div className={styles.gpsHeader}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{fontWeight: 600, color: 'var(--color-primary-dark)'}}>Bantu driver menemukanmu</span>
                    <span className={styles.optionalBadge}>Opsional</span>
                  </div>
                  <p style={{fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px'}}>
                    Tandai lokasi agar driver lebih mudah menemukan alamatmu.
                  </p>
                  
                  {formData.lat && formData.lng ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <MapPicker 
                        lat={formData.lat} 
                        lng={formData.lng} 
                        onChange={(lat, lng) => setFormData(prev => ({...prev, lat, lng}))} 
                      />
                      <div className={styles.gpsValueRow}>
                        <span className={styles.gpsCoords}>{formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</span>
                        <button type="button" onClick={handleGetLocation} className={styles.gpsRetakeBtn} disabled={isDetectingLocation}>
                          {isDetectingLocation ? 'Mendeteksi...' : 'Deteksi Ulang'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" onClick={handleGetLocation} className={styles.gpsBtn} style={{ flex: 1 }} disabled={isDetectingLocation}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{marginRight: '8px'}}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        {isDetectingLocation ? 'Mendeteksi Lokasi...' : 'Gunakan Lokasi Saat Ini'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({...prev, lat: -6.200000, lng: 106.816666}))} 
                        className={styles.gpsBtn} 
                        style={{ flex: 1, background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                        disabled={isDetectingLocation}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{marginRight: '8px'}}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Pilih Manual di Peta
                      </button>
                    </div>
                  )}
                </div>
                
                <div className={`${styles.fullWidth} ${styles.switchRow}`}>
                  <label htmlFor="isPrimary" className={styles.switchLabel}>
                    Jadikan sebagai alamat utama
                  </label>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      id="isPrimary" 
                      name="isPrimary" 
                      checked={formData.isPrimary} 
                      onChange={handleChange} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
