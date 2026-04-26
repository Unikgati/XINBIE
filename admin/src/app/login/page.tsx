'use client';

import { useState } from 'react';
import { api, setAuthToken } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        noAuth: true,
      });
      
      if (res.accessToken) {
        setAuthToken(res.accessToken);
        window.location.href = '/dashboard';
      } else {
        throw new Error('Respons tidak valid dari server');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #9ECE67 0%, #2D6739 100%);
          padding: 24px;
          font-family: 'Poppins', sans-serif;
        }

        .login-card {
          background: #fff;
          border-radius: 20px;
          padding: 48px 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .login-brand img {
          width: 36px;
          height: 36px;
          filter: brightness(0) saturate(100%) invert(78%) sepia(28%) saturate(580%) hue-rotate(42deg) brightness(96%) contrast(88%);
        }

        .login-brand-text h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #212121;
          line-height: 1.2;
        }

        .login-brand-text p {
          margin: 0;
          font-size: 12px;
          color: #9E9E9E;
          font-weight: 500;
        }

        .login-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-heading h2 {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 700;
          color: #212121;
        }

        .login-heading p {
          margin: 0;
          font-size: 14px;
          color: #757575;
        }

        .login-error-box {
          background: #FEF2F2;
          color: #EF4444;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.4;
        }

        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #212121;
          margin-bottom: 6px;
        }

        .login-input-wrap {
          position: relative;
          margin-bottom: 18px;
        }

        .login-input-wrap .li-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          color: #BDBDBD;
          pointer-events: none;
          transition: color 0.2s;
        }

        .login-input-wrap input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px 13px 44px;
          background: #F5F5F5;
          border: 1.5px solid transparent;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          color: #212121;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-input-wrap input::placeholder {
          color: #BDBDBD;
        }

        .login-input-wrap input:focus {
          border-color: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.08);
        }

        .login-input-wrap input:focus ~ .li-icon {
          color: #4CAF50;
        }

        .login-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #BDBDBD;
          padding: 4px;
          display: flex;
          transition: color 0.15s;
        }

        .login-eye:hover { color: #757575; }

        .login-submit {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          background: #9ECE67;
          color: #fff;
          border: none;
          border-radius: 24px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s, box-shadow 0.2s;
        }

        .login-submit:hover:not(:disabled) {
          background: #8CBE55;
          box-shadow: 0 4px 16px rgba(158,206,103,0.4);
        }

        .login-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .login-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 11px;
          color: #BDBDBD;
        }

        @keyframes lspin {
          to { transform: rotate(360deg); }
        }
        .login-spinner-ring {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lspin 0.7s linear infinite;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 36px 24px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="login-card">
        <div className="login-brand">
          <img src="/logo-icon.svg" alt="DapurGizi" />
        </div>

        <div className="login-heading">
          <h2>Selamat Datang!</h2>
          <p>Masuk untuk mengelola aplikasi</p>
        </div>

        {error && (
          <div className="login-error-box">
            <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label className="login-label">Email</label>
          <div className="login-input-wrap">
            <span className="material-symbols-outlined li-icon">email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              required
              disabled={loading}
            />
          </div>

          <label className="login-label">Password</label>
          <div className="login-input-wrap">
            <span className="material-symbols-outlined li-icon">lock</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <div className="login-spinner-ring" />
            ) : 'Masuk'}
          </button>
        </form>

        <div className="login-footer">
          © {new Date().getFullYear()} DapurGizi
        </div>
      </div>
    </div>
  );
}
