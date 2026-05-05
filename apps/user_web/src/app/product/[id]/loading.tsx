import React from 'react';
import styles from './ProductDetail.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Left Column - Image Skeleton */}
        <div className={styles.imageSection}>
          <div className="shimmer shimmer-rounded" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '24px' }}></div>
        </div>

        {/* Right Column - Details Skeleton */}
        <div className={styles.infoSection}>
          <div className="shimmer shimmer-rounded" style={{ width: '80px', height: '24px', borderRadius: '16px', marginBottom: '16px' }}></div>
          <div className="shimmer shimmer-rounded" style={{ width: '80%', height: '32px', marginBottom: '16px' }}></div>
          
          <div className="shimmer shimmer-rounded" style={{ width: '150px', height: '40px', marginBottom: '32px' }}></div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div className="shimmer shimmer-rounded" style={{ width: '100px', height: '20px' }}></div>
            <div className="shimmer shimmer-rounded" style={{ width: '100px', height: '20px' }}></div>
          </div>

          <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '80px', borderRadius: '12px', marginBottom: '24px' }}></div>

          <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '120px' }}></div>
        </div>
      </div>
    </div>
  );
}
