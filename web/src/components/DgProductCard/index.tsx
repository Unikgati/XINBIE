'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './DgProductCard.module.css';
import DgDiscountBadge from '../DgDiscountBadge/index';

interface Props {
  id: string;
  slug?: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string;
  discountPrice?: number;
  discountPercent?: number;
  variantCount?: number;
  tags?: string[];
  flashPrice?: number;
  ratingAvg?: number;
}

const DgProductCard = React.memo(({
  id,
  slug,
  name,
  price,
  unit,
  imageUrl,
  discountPrice,
  discountPercent,
  tags = [],
  flashPrice,
  ratingAvg = 4.8,
}: Props) => {
  const displayPrice = flashPrice ?? discountPrice ?? price;
  const hasDiscount = (discountPrice != null && discountPrice < price) || flashPrice != null;

  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <Link href={`/product/${slug || id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={name} 
              fill 
              sizes="(max-width: 480px) 50vw, 33vw"
              style={{ objectFit: 'cover' }} 
              unoptimized
            />
          ) : (
            <div className={styles.placeholder}>
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" className={styles.placeholderIcon}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
          )}
        </div>
        



        <div className={styles.content}>
          <h3 className={styles.name} title={name}>
            <img src="/images/mall_ori.webp" alt="Mall Ori" className={styles.mallBadge} />
            {name}
          </h3>

          {tags.length > 0 && (
            <div className={styles.cardTags}>
              {tags.slice(0, 3).join(' · ')}
              {tags.length > 3 && ` +${tags.length - 3}`}
            </div>
          )}
          
          <div className={styles.priceContainer}>
            <span className={`${styles.activePrice} ${flashPrice ? styles.flashPrice : ''}`}>Rp {formatRp(displayPrice)}</span>
            {hasDiscount && discountPercent != null && (
              <span className={styles.inlineDiscountBadge}>{discountPercent}% OFF</span>
            )}
          </div>

          <div className={styles.footer}>
            <div className={styles.ratingSection}>
              <div className={styles.ratingBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f59e0b' }}>star</span>
                {ratingAvg.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

DgProductCard.displayName = 'DgProductCard';
export default DgProductCard;
