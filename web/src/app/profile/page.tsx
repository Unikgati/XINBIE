'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './page.module.css';
import { useAuthStore, User } from '@/store/authStore';
import { useSnackbarStore } from '@/store/snackbarStore';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProfileSidebar from '@/components/ProfileSidebar/ProfileSidebar';

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const snackbar = useSnackbarStore();

  const [formData, setFormData] = useState({
    name: '',
    phoneWa: ''
  });

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneWa: user.phoneWa || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.name.trim()) return snackbar.show('Nama tidak boleh kosong', 'error');
    if (!formData.phoneWa.trim()) return snackbar.show('Nomor WhatsApp wajib diisi', 'error');

    try {
      setLoading(true);
      const res = await api.put<User>('/auth/profile', formData);
      setUser(res);
      setIsEdit(false);
      snackbar.show('Profil berhasil diperbarui', 'success');
    } catch (err: any) {
      console.error(err);
      snackbar.show(err.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !user) {
    return <div className={`app-container ${styles.container}`}><div className={styles.loading}>Memuat profil...</div></div>;
  }

  return (
    <div className={`app-container ${styles.container}`}>
      <Breadcrumbs items={[{ label: 'Beranda', href: '/' }, { label: 'Profil' }]} />
      <div className={styles.profileGrid}>
        
        <ProfileSidebar />

        {/* Main Content */}
        <div className={styles.mainContent}>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Lengkap</label>
              <input 
                type="text" 
                className={styles.input} 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={!isEdit} 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} value={user.email} disabled />
              <small style={{ color: '#888', fontSize: '12px' }}>Email tidak dapat diubah</small>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Nomor WhatsApp</label>
              <input 
                type="tel" 
                className={styles.input} 
                placeholder="Contoh: 08123456789"
                value={formData.phoneWa} 
                onChange={(e) => setFormData({...formData, phoneWa: e.target.value})}
                disabled={!isEdit} 
              />
              {!user.phoneWa && !isEdit && (
                <small style={{ color: 'var(--color-error)', fontSize: '12px' }}>Wajib diisi untuk membuat pesanan</small>
              )}
            </div>
            
            <div className={styles.fullWidth} style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              {isEdit ? (
                <>
                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button 
                    className={styles.cancelBtn} 
                    style={{ background: '#eee', color: '#333' }}
                    onClick={() => {
                      setIsEdit(false);
                      setFormData({ name: user.name, phoneWa: user.phoneWa || '' });
                    }}
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button className={styles.saveBtn} onClick={() => setIsEdit(true)}>
                  Edit Profil
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
