'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/page.module.css';
import { useAuthStore } from '@/store/authStore';
import { ApiException } from '@/lib/api';
import { useGoogleSignIn } from '@/lib/useGoogleSignIn';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const { googleButtonRef } = useGoogleSignIn(
    async (user) => {
      setError('');
      try {
        await loginWithGoogle(user.idToken, user.name, user.email, user.picture, user.sub);
        router.push('/');
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('Google Sign-In gagal. Coba lagi.');
        }
      }
    },
    (errMsg) => setError(errMsg)
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      router.push(`/otp?email=${encodeURIComponent(email)}&type=verification`);
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
          <h1 className={styles.title}>Daftar DapurGizi</h1>
          <p className={styles.subtitle}>Bergabung dan nikmati kemudahan belanja dapur!</p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nama Lengkap</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Bunda..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className={styles.inputGroup}>
            <label className={styles.label}>Kata Sandi</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"}
                className={styles.input} 
                placeholder="Minimal 8 karakter" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button 
                type="button" 
                className={styles.passwordToggle} 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Konfirmasi Kata Sandi</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showConfirmPassword ? "text" : "password"}
                className={styles.input} 
                placeholder="Ulangi kata sandi" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button 
                type="button" 
                className={styles.passwordToggle} 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className={styles.dividerContainer}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerText}>ATAU</span>
          <div className={styles.dividerLine}></div>
        </div>

        {/* Google's official rendered button */}
        <div ref={googleButtonRef} className={styles.googleButtonContainer}></div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Sudah punya akun? <Link href="/login" className={styles.link}>Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
