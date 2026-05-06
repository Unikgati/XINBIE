import React from 'react';
import DgSkeleton from '../DgSkeleton';
import styles from '@/app/page.module.css';

export const BannerSkeleton = () => (
  <div style={{ marginTop: '24px', marginBottom: '24px' }}>
    <DgSkeleton height="calc(100vw * 0.4)" width="100%" borderRadius="24px" className={styles.bannerSkeleton} />
  </div>
);

export const CategorySkeleton = () => (
  <section className={styles.categoriesSection}>
    <div className={styles.categoriesWrapper}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className={styles.categoryItem}>
          <DgSkeleton width="56px" height="56px" borderRadius="16px" />
          <div style={{ height: '8px' }} />
          <DgSkeleton width="40px" height="12px" />
        </div>
      ))}
    </div>
  </section>
);

export const ProductGridSkeleton = () => (
  <section className={styles.productSection}>
    <DgSkeleton width="150px" height="24px" borderRadius="8px" />
    <div style={{ height: '16px' }} />
    <div className={styles.productGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <DgSkeleton width="100%" height="auto" borderRadius="16px" className={styles.productImageSkeleton} />
          <DgSkeleton width="100%" height="16px" />
          <DgSkeleton width="60%" height="14px" />
          <DgSkeleton width="80%" height="20px" />
        </div>
      ))}
    </div>
  </section>
);
