'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './FlashSaleSection.module.css';

interface Props {
  children: React.ReactNode;
}

export default function FlashSaleGrid({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 180 + 16; // card width + gap
    const amount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div
      className={styles.gridWrapper}
      data-scroll-left={canScrollLeft}
      data-scroll-right={canScrollRight}
    >
      <div
        className={styles.grid}
        ref={scrollRef}
        onScroll={checkScroll}
      >
        {children}
      </div>

      <button
        className={`${styles.navButton} ${styles.prevButton} ${!canScrollLeft ? styles.navButtonHidden : ''}`}
        onClick={() => scroll('left')}
        aria-label="Sebelumnya"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <button
        className={`${styles.navButton} ${styles.nextButton} ${!canScrollRight ? styles.navButtonHidden : ''}`}
        onClick={() => scroll('right')}
        aria-label="Selanjutnya"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
}
