'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/page.module.css';
import { useAuthStore } from '@/store/authStore';
import { ApiException } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      router.push(`/otp?email=${encodeURIComponent(email)}&type=reset`);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Lupa Kata Sandi</h1>
          <p className={styles.subtitle}>Masukkan email Anda untuk menerima kode pemulihan (OTP).</p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <form className={styles.form} onSubmit={handleReset}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="bunda@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Ingat kata sandi Anda? <Link href="/login" className={styles.link}>Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
