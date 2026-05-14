'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../login/page.module.css';
import { useAuthStore } from '@/store/authStore';
import { ApiException } from '@/lib/api';

function OTPForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'verification';
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const verifyResetOtp = useAuthStore((s) => s.verifyResetOtp);
  const resendOtp = useAuthStore((s) => s.resendOtp);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      inputs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Masukkan 6 digit kode OTP');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (type === 'reset') {
        await verifyResetOtp(email, otpString);
        router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${otpString}`);
      } else {
        await verifyEmail(email, otpString);
        router.push('/');
      }
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

  const handleResend = async () => {
    setError('');
    try {
      const otpType = type === 'reset' ? 'password_reset' : 'verification';
      await resendOtp(email, otpType as 'verification' | 'password_reset');
      setCountdown(60);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Gagal mengirim ulang OTP.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Verifikasi OTP</h1>
          <p className={styles.subtitle}>Masukkan 6 digit kode yang dikirim ke <b>{email}</b></p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <form className={styles.form} onSubmit={handleVerify}>
          <div className={styles.otpGrid} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={styles.otpInput}
                value={digit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                required
              />
            ))}
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>
        </form>

        <p className={styles.resendText}>
          Belum menerima kode?{' '}
          <button 
            type="button" 
            className={styles.resendLink} 
            onClick={handleResend}
            disabled={countdown > 0}
          >
            Kirim Ulang {countdown > 0 ? `(${countdown}s)` : ''}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.card}>Loading...</div></div>}>
      <OTPForm />
    </Suspense>
  );
}
