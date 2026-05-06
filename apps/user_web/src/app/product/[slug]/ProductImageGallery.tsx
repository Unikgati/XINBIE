'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './ProductDetail.module.css';

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export default function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const mainImage = images.length > 0 ? images[activeImageIndex] : null;

  return (
    <div className={styles.imageSection}>
      <div className={styles.mainImageWrapper}>
        {mainImage ? (
          <Image 
            src={mainImage} 
            alt={name} 
            fill 
            style={{ objectFit: 'cover' }} 
            unoptimized
            priority
          />
        ) : (
          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5'}}>
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="#bdbdbd" strokeWidth="1" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <div className={styles.thumbnailGrid}>
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className={`${styles.thumbnail} ${idx === activeImageIndex ? styles.thumbnailActive : ''}`}
              onClick={() => setActiveImageIndex(idx)}
            >
              <Image src={img} alt={`Thumbnail ${idx}`} fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* Promo Banner */}
      <div className={styles.promoBanner}>
        <div className={styles.promoTextContainer}>
          <div className={styles.promoTitle}>Belanja Dapur Lebih Aman & Terpercaya</div>
          <div className={styles.promoSubtitle}>Sayur, buah, dan bahan segar langsung dari sumber terbaik.</div>
        </div>
        <img src="/images/mascot_driver.png" alt="Mascot" className={styles.promoMascot} />
      </div>
    </div>
  );
}
