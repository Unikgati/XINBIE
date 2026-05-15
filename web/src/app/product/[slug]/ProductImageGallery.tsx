'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './ProductDetail.module.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface ProductImageGalleryProps {
  images: string[];
  name: string;
  variantImage?: string | null;
}

export default function ProductImageGallery({ images, name, variantImage }: ProductImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showVariantImage, setShowVariantImage] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // When variantImage changes, automatically show it
  React.useEffect(() => {
    if (variantImage) {
      setShowVariantImage(true);
    }
  }, [variantImage]);

  const handleThumbnailClick = (idx: number) => {
    setActiveImageIndex(idx);
    setShowVariantImage(false);
  };

  const handleMainImageClick = () => {
    if (showVariantImage && variantImage) {
      // Find variant image in list or prepend it
      setPhotoIndex(0);
    } else {
      setPhotoIndex(activeImageIndex);
    }
    setLightboxOpen(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showVariantImage) {
      setShowVariantImage(false);
      setActiveImageIndex(0);
    } else {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showVariantImage) {
      setShowVariantImage(false);
      setActiveImageIndex(images.length - 1);
    } else {
      setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };
  
  const mainImage = showVariantImage && variantImage ? variantImage : (images.length > 0 ? images[activeImageIndex] : null);

  // Prepare slides for lightbox
  const slides = images.map(src => ({ src }));
  if (variantImage && !images.includes(variantImage)) {
    // If variant image is not in gallery, add it at the beginning for the lightbox
    slides.unshift({ src: variantImage });
  }

  return (
    <div className={styles.imageSection}>
      <div className={styles.imageGalleryWrapper}>
        <div 
          className={styles.mainImageWrapper} 
          onClick={handleMainImageClick} 
          style={{ cursor: 'zoom-in' }}
        >
          {mainImage ? (
            <>
              <Image 
                src={mainImage} 
                alt={name} 
                fill 
                style={{ objectFit: 'cover' }} 
                unoptimized
                priority
              />
              <div className={styles.mainImageGradient} />
            </>
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
          <>
            <button 
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={prevImage}
              aria-label="Previous image"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={nextImage}
              aria-label="Next image"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className={styles.thumbnailContainer}>
          <div className={styles.thumbnailGrid}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className={`${styles.thumbnail} ${!showVariantImage && idx === activeImageIndex ? styles.thumbnailActive : ''}`}
                onClick={() => handleThumbnailClick(idx)}
              >
                <Image src={img} alt={`Thumbnail ${idx}`} fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
          <div className={styles.thumbnailFadeLeft} />
          <div className={styles.thumbnailFadeRight} />
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={photoIndex}
        slides={slides}
      />
    </div>
  );
}
