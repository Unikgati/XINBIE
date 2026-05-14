import React from 'react';
import DgSkeleton from '@/components/DgSkeleton';
import styles from './RecipeDetail.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.breadcrumbs} style={{ padding: '20px 0 10px' }}>
          <DgSkeleton width="200px" height="14px" borderRadius="4px" />
        </div>

        <div className={styles.splitLayout}>
          {/* SIDEBAR SKELETON */}
          <aside className={styles.sidebar}>
            <div className={styles.stickySidebar}>
              <div className={styles.heroImageWrapper}>
                <DgSkeleton width="100%" height="100%" borderRadius="24px" />
              </div>

              {/* General Ingredients Shimmer */}
              <div className={styles.ingredientsBox}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <DgSkeleton width="55%" height="20px" borderRadius="4px" />
                  <DgSkeleton width="40%" height="12px" borderRadius="4px" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <DgSkeleton width="6px" height="6px" borderRadius="50%" />
                      <DgSkeleton width={i % 2 === 0 ? '70%' : '85%'} height="14px" borderRadius="4px" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Shoppable Ingredients Shimmer */}
              <div className={styles.ingredientsBox}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <DgSkeleton width="60%" height="20px" borderRadius="4px" />
                  <DgSkeleton width="45%" height="12px" borderRadius="4px" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', background: 'var(--divider)', padding: '12px', borderRadius: '12px' }}>
                      <DgSkeleton width="50px" height="50px" borderRadius="8px" />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                        <DgSkeleton width="80%" height="14px" borderRadius="4px" />
                        <DgSkeleton width="40%" height="12px" borderRadius="4px" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* CONTENT SKELETON */}
          <div className={styles.content}>
            <div style={{ marginBottom: '32px' }}>
              <DgSkeleton width="90%" height="42px" borderRadius="10px" style={{ marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <DgSkeleton width="100px" height="16px" borderRadius="4px" />
                <DgSkeleton width="80px" height="16px" borderRadius="4px" />
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <DgSkeleton width="180px" height="32px" borderRadius="6px" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <DgSkeleton width="36px" height="36px" borderRadius="12px" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      <DgSkeleton width="100%" height="16px" borderRadius="4px" />
                      <DgSkeleton width="95%" height="16px" borderRadius="4px" />
                      <DgSkeleton width="40%" height="16px" borderRadius="4px" />
                    </div>
                    <DgSkeleton width="100%" height="350px" borderRadius="24px" />
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
