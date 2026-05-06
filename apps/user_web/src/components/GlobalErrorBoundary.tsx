'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>Waduh! Ada sedikit kendala</h2>
          <p style={{ color: '#666', marginBottom: '24px', maxWidth: '400px' }}>
            Aplikasi mengalami kesalahan teknis. Jangan khawatir, silakan coba muat ulang halaman.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
