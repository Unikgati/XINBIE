import React from 'react';
import styles from './page.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      {/* Category Header Skeleton */}
      <div className={styles.header}>
        <div className="shimmer shimmer-circle" style={{ width: '80px', height: '80px', marginBottom: '16px' }}></div>
        <div className="shimmer shimmer-rounded" style={{ width: '200px', height: '32px', marginBottom: '8px' }}></div>
        <div className="shimmer shimmer-rounded" style={{ width: '300px', height: '16px' }}></div>
      </div>

      {/* Grid Skeleton */}
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="shimmer shimmer-rounded" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px' }}></div>
            <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '16px' }}></div>
            <div className="shimmer shimmer-rounded" style={{ width: '60%', height: '14px' }}></div>
            <div className="shimmer shimmer-rounded" style={{ width: '80%', height: '20px', marginTop: '4px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
