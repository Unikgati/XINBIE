'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './DgBannerCarousel.module.css';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
}

interface Props {
  banners: Banner[];
}

export default function DgBannerCarousel({ banners }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const safeBanners = banners ?? [];

  useEffect(() => {
    if (safeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % safeBanners.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, 4000); // 4 seconds auto scroll

    return () => clearInterval(interval);
  }, [safeBanners.length]);

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const itemWidth = container.clientWidth;
      container.scrollTo({
        left: itemWidth * index,
        behavior: 'smooth',
      });
    }
  };

  const scrollNext = () => {
    const nextIndex = (currentIndex + 1) % safeBanners.length;
    setCurrentIndex(nextIndex);
    scrollToIndex(nextIndex);
  };

  const scrollPrev = () => {
    const prevIndex = (currentIndex - 1 + safeBanners.length) % safeBanners.length;
    setCurrentIndex(prevIndex);
    scrollToIndex(prevIndex);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const itemWidth = scrollRef.current.clientWidth;
      const newIndex = Math.round(scrollPosition / itemWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < safeBanners.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  if (safeBanners.length === 0) return null;

  return (
    <section className={styles.bannersSection}>
      <div className={styles.carouselWrapper}>
        <div 
          className={styles.bannersCarousel} 
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {safeBanners.map((banner) => (
            <div key={banner.id} className={styles.bannerItem}>
              <Image 
                src={banner.imageUrl} 
                alt={banner.title || 'Promo Banner'} 
                fill 
                style={{ objectFit: 'cover' }} 
                className={styles.bannerImage}
                unoptimized
              />
            </div>
          ))}
        </div>
        
        {safeBanners.length > 1 && (
          <>
            <button className={`${styles.navButton} ${styles.prevButton}`} onClick={scrollPrev} aria-label="Previous">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button className={`${styles.navButton} ${styles.nextButton}`} onClick={scrollNext} aria-label="Next">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <div className={styles.dotsContainer}>
              {safeBanners.map((_, index) => (
                <div 
                  key={index}
                  className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ''}`}
                  onClick={() => {
                    setCurrentIndex(index);
                    scrollToIndex(index);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
