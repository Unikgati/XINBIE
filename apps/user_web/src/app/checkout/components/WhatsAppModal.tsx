'use client';

import React, { useState } from 'react';
import styles from './WhatsAppModal.module.css';
import { api } from '@/lib/api';
import { useAuthStore, User } from '@/store/authStore';
import { useSnackbarStore } from '@/store/snackbarStore';

interface WhatsAppModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function WhatsAppModal({ onSuccess, onClose }: WhatsAppModalProps) {
  const [phoneWa, setPhoneWa] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const snackbar = useSnackbarStore();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneWa.trim()) return snackbar.show('Mohon masukkan nomor WhatsApp', 'error');

    try {
      setLoading(true);
      const res = await api.put<User>('/auth/profile', { phoneWa });
      // Update global state immediately
      setUser(res);
      snackbar.show('Nomor WhatsApp berhasil disimpan', 'success');
      // Trigger success callback
      onSuccess();
    } catch (err: any) {
      console.error(err);
      snackbar.show(err.message || 'Gagal menyimpan nomor WhatsApp', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396 0 12.032c0 2.12.554 4.189 1.607 6.048L0 24l6.117-1.605a11.845 11.845 0 005.933 1.598h.005c6.637 0 12.032-5.395 12.035-12.032a11.762 11.762 0 00-3.417-8.481z" fill="white"/>
            </svg>
          </div>
          <h3 className={styles.title}>WhatsApp Aktif</h3>
          <p className={styles.subtitle}>
            Mohon masukkan nomor WhatsApp untuk koordinasi pengiriman pesanan Anda.
          </p>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nomor WhatsApp</label>
            <input 
              type="tel" 
              className={styles.input} 
              placeholder="Contoh: 08123456789"
              value={phoneWa}
              onChange={(e) => setPhoneWa(e.target.value)}
              autoFocus
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  );
}
