import React from 'react';
import styles from './ProductDetail.module.css';
import DgSkeleton from '@/components/DgSkeleton';

export default function ProductDetailSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Left Column - Image Skeleton */}
        <div className={styles.imageSection}>
          <DgSkeleton width="100%" height="auto" borderRadius="24px" className={styles.mainImageWrapper} />
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <DgSkeleton width="80px" height="80px" borderRadius="12px" count={4} />
          </div>
        </div>

        {/* Right Column - Details Skeleton */}
        <div className={styles.infoSection}>
          <DgSkeleton width="80px" height="24px" borderRadius="16px" />
          <div style={{ height: '16px' }} />
          <DgSkeleton width="90%" height="40px" />
          
          <div style={{ height: '24px' }} />
          <DgSkeleton width="200px" height="48px" />

          <div style={{ height: '32px' }} />
          <div style={{ display: 'flex', gap: '16px' }}>
            <DgSkeleton width="120px" height="56px" borderRadius="12px" />
            <DgSkeleton width="200px" height="56px" borderRadius="12px" />
            <DgSkeleton width="200px" height="56px" borderRadius="12px" />
          </div>

          <div style={{ height: '40px' }} />
          <DgSkeleton width="100%" height="200px" borderRadius="16px" />
        </div>
      </div>
    </div>
  );
}
