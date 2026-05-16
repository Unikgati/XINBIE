import React from 'react';
import DgSkeleton from '../DgSkeleton';
import styles from '@/app/page.module.css';

export const BannerSkeleton = () => (
  <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '16px' }}>
    <DgSkeleton height="100%" width="100%" borderRadius="16px" />
  </div>
);

export const CategorySkeleton = () => (
  <section className={styles.categoriesSection} style={{ overflow: 'hidden', padding: '16px 0' }}>
    <div style={{ display: 'flex', gap: '10px', padding: '4px 20px', overflow: 'hidden' }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <DgSkeleton key={i} width="100px" height="38px" borderRadius="100px" />
      ))}
    </div>
  </section>
);

export const ProductGridSkeleton = () => (
  <div className={styles.productGrid}>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--color-card, #fff)', 
        borderRadius: '16px',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        height: '100%'
      }}>
        {/* Image Shimmer with 1:1 Aspect Ratio and Top Radius */}
        <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative' }}>
          <DgSkeleton width="100%" height="100%" borderRadius="16px 16px 0 0" />
        </div>
        
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {/* Mall Badge + Title Shimmer */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <DgSkeleton width="30px" height="14px" borderRadius="4px" />
            <DgSkeleton width="70%" height="16px" borderRadius="4px" />
          </div>
          <DgSkeleton width="40%" height="14px" borderRadius="4px" />
          
          <div style={{ marginTop: '4px' }}>
            <DgSkeleton width="60%" height="20px" borderRadius="4px" />
          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <DgSkeleton width="40px" height="14px" borderRadius="4px" />
            <DgSkeleton width="24px" height="24px" borderRadius="6px" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
