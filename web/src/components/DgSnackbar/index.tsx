'use client';

import React from 'react';
import { useSnackbarStore } from '@/store/snackbarStore';
import styles from './DgSnackbar.module.css';

export default function DgSnackbar() {
  const { message, type, isVisible } = useSnackbarStore();

  if (!isVisible) return null;

  return (
    <div className={`${styles.snackbar} ${styles[type]}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        {type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}
      </span>
      {message}
    </div>
  );
}
