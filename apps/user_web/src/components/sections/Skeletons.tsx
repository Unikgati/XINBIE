import React from 'react';
import DgSkeleton from '../DgSkeleton';
import styles from '@/app/page.module.css';

export const BannerSkeleton = () => (
  <div style={{ marginTop: '24px', marginBottom: '40px' }}>
    <DgSkeleton height="350px" width="100%" borderRadius="24px" className={styles.bannerSkeleton} />
  </div>
);

export const CategorySkeleton = () => (
  <section className={styles.categoriesSection}>
    <div className={styles.categoriesWrapper}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className={styles.categoryItem}>
          <DgSkeleton width="64px" height="64px" borderRadius="20px" />
          <div style={{ height: '12px' }} />
          <DgSkeleton width="50px" height="14px" borderRadius="4px" />
        </div>
      ))}
    </div>
  </section>
);

export const ProductGridSkeleton = () => (
  <section className={styles.productSection}>
    <div style={{ marginBottom: '24px' }}>
      <DgSkeleton width="180px" height="28px" borderRadius="8px" />
    </div>
    <div className={styles.productGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          background: '#fff', 
          paddingBottom: '16px',
          borderRadius: '16px',
          border: '1px solid #eee'
        }}>
          <DgSkeleton width="100%" height="auto" borderRadius="16px 16px 0 0" style={{ aspectRatio: '1/1' }} />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DgSkeleton width="90%" height="16px" borderRadius="4px" />
            <DgSkeleton width="40%" height="14px" borderRadius="4px" />
            <div style={{ height: '8px' }} />
            <DgSkeleton width="100%" height="32px" borderRadius="100px" />
          </div>
        </div>
      ))}
    </div>
  </section>
);
