'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './DgProductCard.module.css';
import DgDiscountBadge from '../DgDiscountBadge/index';
import DgQuantitySelector from '../DgQuantitySelector/index';
import { useCartStore } from '@/store/cartStore';

interface Props {
  id: string;
  slug?: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string;
  discountPrice?: number;
  discountPercent?: number;
  isOutOfStock?: boolean;
  variantCount?: number;
  hasMultiplePrices?: boolean;
  tags?: string[];
}

export default function DgProductCard({
  id,
  slug,
  name,
  price,
  unit,
  imageUrl,
  discountPrice,
  discountPercent,
  isOutOfStock = false,
  variantCount = 0,
  hasMultiplePrices = false,
  tags = [],
}: Props) {
  const [mounted, setMounted] = useState(false);
  const qty = useCartStore((s) => s.getQuantity(id));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => { setMounted(true); }, []);

  const displayPrice = discountPrice ?? price;
  const hasDiscount = discountPrice != null && discountPrice < price;

  const handleQtyChange = (newQty: number) => {
    updateQuantity(id, newQty);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      productId: id,
      name,
      price: displayPrice,
      originalPrice: price,
      unit,
      imageUrl,
    });
  };

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

        {hasDiscount && discountPercent != null && (
          <DgDiscountBadge discountPercent={discountPercent} />
        )}

        {variantCount > 0 && (
          <div className={styles.variantBadge}>
            {variantCount} Varian
          </div>
        )}

        {isOutOfStock && (
          <div className={styles.outOfStockOverlay}>
            <div className={styles.outOfStockLabel}>Habis</div>
          </div>
        )}

        <div className={styles.content}>
          <h3 className={styles.name} title={name}>{name}</h3>

          {tags.length > 0 && (
            <div className={styles.cardTags}>
              {tags.slice(0, 3).join(' · ')}
              {tags.length > 3 && ` +${tags.length - 3}`}
            </div>
          )}
          
          <div className={styles.priceContainer}>
            <span className={styles.activePrice}>Rp {formatRp(displayPrice)}</span>
            {hasDiscount && !hasMultiplePrices && (
              <span className={styles.strikethroughPrice}>Rp {formatRp(price)}</span>
            )}
          </div>

          <div className={styles.footer}>
            <div className={styles.unitBadge}>/{unit}</div>
            
            {!isOutOfStock && (
              <div className={styles.actionContainer}>
                {mounted && qty > 0 && variantCount === 0 ? (
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <DgQuantitySelector 
                      quantity={qty} 
                      onChanged={handleQtyChange} 
                      compact 
                    />
                  </div>
                ) : (
                  <button 
                    className={styles.addButton} 
                    onClick={handleAddClick}
                    aria-label="Tambah"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
