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
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #044bd7 0%, #17a1fb 100%);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        /* ===== Outer container with border ===== */
        .login-outer {
          width: 100%;
          max-width: 880px;
          border: 1.5px solid rgba(255,255,255,0.25);
          border-radius: 28px;
          padding: 20px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          z-index: 1;
        }

        /* ===== Background Shapes ===== */
        .login-bg-shapes {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          pointer-events: none;
        }

        .login-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.5;
          filter: blur(60px);
          animation: shape-move 20s infinite alternate ease-in-out;
        }

        .shape-1 {
          width: 450px;
          height: 450px;
          background: #db2777;
          top: -150px;
          left: -150px;
        }

        .shape-2 {
          width: 320px;
          height: 320px;
          background: #db2777;
          bottom: -100px;
          right: -100px;
          animation-delay: -5s;
        }

        @keyframes shape-move {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.05); }
          100% { transform: translate(-30px, -20px) scale(0.95); }
        }

        /* ===== Inner card: split layout ===== */
        .login-inner {
          display: flex;
          border-radius: 20px;
          overflow: hidden;
          min-height: 520px;
          position: relative;
        }

        /* ===== Left: White form area ===== */
        .login-left {
          flex: 0 0 420px;
          background: rgba(255, 255, 255, 0.85);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-radius: 20px;
          z-index: 1;
        }

        .login-chip {
          display: inline-block;
          padding: 5px 16px;
          border: 1.5px solid #E0E0E0;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #757575;
          margin-bottom: 28px;
          width: fit-content;
        }

        .login-heading h2 {
          margin: 0 0 4px;
          font-size: 28px;
          font-weight: 700;
          color: #212121;
        }

        .login-heading p {
          margin: 0 0 28px;
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
          color: #212121;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-input-wrap input::placeholder { color: #BDBDBD; }

        .login-input-wrap input:focus {
          border-color: #044bd7;
          box-shadow: 0 0 0 3px rgba(4,75,215,0.08);
        }

        .login-input-wrap input:focus ~ .li-icon { color: #044bd7; }

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
          background: #044bd7;
          color: #fff;
          border: none;
          border-radius: 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s, box-shadow 0.2s;
        }

        .login-submit:hover:not(:disabled) {
          background: #0339a3;
          box-shadow: 0 4px 16px rgba(4,75,215,0.4);
        }

        .login-submit:active:not(:disabled) { transform: scale(0.98); }

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

        /* ===== Right: Green area with mascot ===== */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
        }

        .login-brand-top {
          position: absolute;
          top: 24px;
          right: 28px;
        }

        .login-brand-top img {
          height: 24px;
          width: auto;
        }

        .login-promo-text {
          font-size: 48px;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          text-align: center;
          padding: 0 40px;
          text-transform: uppercase;
          letter-spacing: -1px;
          opacity: 0.9;
        }

        /* ===== Responsive ===== */
        @media (max-width: 880px) {
          .login-bg-shapes-wrapper {
            width: 100% !important;
            max-width: 420px;
          }
          .shape-1 { width: 300px; height: 300px; top: -100px; left: -50px; }
          .shape-2 { width: 200px; height: 200px; bottom: -50px; right: -50px; }
        }

        @media (max-width: 820px) {
          .login-root { padding: 20px; }

          .login-outer {
            max-width: 480px;
            padding: 12px;
          }

          .login-right { display: none; }

          .login-left {
            flex: 1;
            padding: 40px 32px;
          }
          
          .login-promo-text { font-size: 32px; }
        }

        @media (max-width: 480px) {
          .login-root { padding: 12px; }
          .login-outer { padding: 8px; border-radius: 24px; }
          .login-left { 
            padding: 32px 20px; 
            border-radius: 18px;
          }
          .login-heading h2 { font-size: 24px; }
        }
      `}</style>

      <div className="login-bg-shapes-wrapper" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '880px', display: 'flex', justifyContent: 'center' }}>
        <div className="login-outer" style={{ overflow: 'hidden' }}>
          {/* Background Shapes clipped to the card */}
          <div className="login-bg-shapes">
            <div className="login-shape shape-1"></div>
            <div className="login-shape shape-2"></div>
          </div>
          
          <div className="login-inner">
          {/* Left: Login Form */}
          <div className="login-left">
            

            <div className="login-heading">
              <h2>Selamat Datang !</h2>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="login-spinner-ring" />
                    <span>Mohon tunggu...</span>
                  </div>
                ) : 'Masuk'}
              </button>
            </form>

            <div className="login-footer">
              © {new Date().getFullYear()} XINBIE
            </div>
          </div>

          {/* Right: Mascot + Logo */}
          <div className="login-right">
            <div className="login-brand-top">
              <img src="/logo-white.svg" alt="XINBIE" />
            </div>
            <div className="login-promo-text">
              Wellness in motion
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
