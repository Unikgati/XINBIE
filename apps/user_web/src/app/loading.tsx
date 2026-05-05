import React from 'react';
import styles from './page.module.css';

export default function Loading() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        
        {/* Banner Skeleton */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div className="shimmer shimmer-rounded" style={{ width: '100%', aspectRatio: '2.5/1', borderRadius: '24px' }}></div>
        </div>

        {/* Categories Skeleton */}
        <section className={styles.categoriesSection}>
          <div className={styles.categoriesWrapper}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className={styles.categoryItem}>
                <div className="shimmer shimmer-circle" style={{ width: '56px', height: '56px', borderRadius: '16px', marginBottom: '8px' }}></div>
                <div className="shimmer shimmer-rounded" style={{ width: '40px', height: '12px' }}></div>
              </div>
            ))}
          </div>
        </section>

        {/* Products Skeleton */}
        <section className={styles.section}>
          <div className="shimmer shimmer-rounded" style={{ width: '150px', height: '24px', marginBottom: '16px' }}></div>
          <div className={styles.productGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="shimmer shimmer-rounded" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px' }}></div>
                <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '16px' }}></div>
                <div className="shimmer shimmer-rounded" style={{ width: '60%', height: '14px' }}></div>
                <div className="shimmer shimmer-rounded" style={{ width: '80%', height: '20px', marginTop: '4px' }}></div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
