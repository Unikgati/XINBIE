import React from 'react';
import DgSkeleton from '@/components/DgSkeleton';
import styles from './RecipeDetail.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.breadcrumbs} style={{ marginBottom: '24px' }}>
          <DgSkeleton width="250px" height="16px" borderRadius="4px" />
        </div>

        <div className={styles.splitLayout}>
          {/* SIDEBAR SKELETON */}
          <aside className={styles.sidebar}>
            <div className={styles.heroImageWrapper} style={{ marginBottom: '24px' }}>
              <DgSkeleton width="100%" height="100%" borderRadius="24px" />
            </div>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid var(--color-divider)' }}>
              <DgSkeleton width="60%" height="24px" borderRadius="4px" style={{ marginBottom: '8px' }} />
              <DgSkeleton width="40%" height="14px" borderRadius="4px" style={{ marginBottom: '32px' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #f5f5f5', paddingBottom: '16px' }}>
                    <DgSkeleton width="70px" height="70px" borderRadius="12px" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                      <DgSkeleton width="90%" height="16px" borderRadius="4px" />
                      <DgSkeleton width="40%" height="14px" borderRadius="4px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* CONTENT SKELETON */}
          <div className={styles.content}>
            <div style={{ marginBottom: '40px' }}>
              <DgSkeleton width="85%" height="48px" borderRadius="8px" style={{ marginBottom: '16px' }} />
              <DgSkeleton width="30%" height="20px" borderRadius="4px" />
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <DgSkeleton width="220px" height="32px" borderRadius="6px" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <DgSkeleton width="36px" height="36px" borderRadius="50%" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      <DgSkeleton width="100%" height="18px" borderRadius="4px" />
                      <DgSkeleton width="95%" height="18px" borderRadius="4px" />
                      <DgSkeleton width="60%" height="18px" borderRadius="4px" />
                    </div>
                    <DgSkeleton width="100%" height="300px" borderRadius="20px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
