import React from 'react';
import DgSkeleton from '../DgSkeleton';
import styles from '@/app/page.module.css';

export const BannerSkeleton = () => (
  <div style={{ marginTop: '24px', marginBottom: '40px' }}>
    <DgSkeleton height="350px" width="100%" borderRadius="24px" />
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
  <div className={styles.productGrid} style={{ marginTop: '24px' }}>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div key={i} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#fff', 
        borderRadius: '16px',
        border: '1px solid #eee',
        overflow: 'hidden',
        height: '100%'
      }}>
        {/* Image Shimmer with 1:1 Aspect Ratio */}
        <div style={{ width: '100%', paddingTop: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <DgSkeleton width="100%" height="100%" borderRadius="0" />
          </div>
        </div>
        
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {/* Product Name (Shopee Mall Style) */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <DgSkeleton width="30px" height="14px" borderRadius="3px" /> {/* Mall Badge */}
            <DgSkeleton width="80%" height="16px" borderRadius="4px" />
          </div>
          
          {/* Tags */}
          <DgSkeleton width="50%" height="12px" borderRadius="4px" />
          
          {/* Price */}
          <DgSkeleton width="60%" height="20px" borderRadius="4px" style={{ marginTop: '4px' }} />
          
          {/* Footer (Rating) */}
          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <DgSkeleton width="45px" height="16px" borderRadius="10px" /> {/* Rating Pill */}
          </div>
        </div>
      </div>
    ))}
  </div>
);
