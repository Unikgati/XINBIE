'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './DgProductRow.module.css';
import { useCartStore } from '@/store/cartStore';
import DgQuantitySelector from '../DgQuantitySelector/index';
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
  tags?: string[];
  stockQty?: number;
  isUnlimitedStock?: boolean;
  ratingAvg?: number;
}

export default function DgProductRow({ 
  id, slug, name, price, unit, imageUrl, 
  discountPrice, discountPercent, tags = [],
  stockQty = 99, isUnlimitedStock = true,
  ratingAvg = 4.8
}: Props) {
  const [mounted, setMounted] = useState(false);
  const qty = useCartStore((s) => s.getQuantity(id));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const addItem = useCartStore((s) => s.addItem);
  
  const displayPrice = discountPrice ?? price;
  const isFlashSale = tags.includes('Flash Sale');
  const hasDiscount = discountPrice != null && discountPrice < price;

  useEffect(() => { setMounted(true); }, []);

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
      stockQty,
      isUnlimitedStock,
    }, 1);
  };

  const formatRp = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const isOutOfStock = !isUnlimitedStock && stockQty <= 0;

  return (
    <div className={`${styles.row} ${isOutOfStock ? styles.outOfStock : ''}`}>
      {/* Badge Pita Lipat (Ditempatkan di sini agar tidak terpotong) */}
      {isFlashSale ? (
        <div className={styles.flashSaleBadgeContainer}>
          <div className={styles.flashSaleBadge}>
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div className={styles.flashSaleFold}></div>
        </div>
      ) : hasDiscount && discountPercent && (
        <div className={styles.discountBadgeWrapper}>
          <DgDiscountBadge discountPercent={discountPercent} />
        </div>
      )}

      <Link href={isOutOfStock ? '#' : `/product/${slug || id}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <Image 
            src={imageUrl || '/placeholder.jpg'} 
            alt={name} 
            fill 
            style={{ objectFit: 'cover' }} 
            unoptimized
          />
          {isOutOfStock && (
            <div className={styles.stockOverlay}>
              <span>HABIS</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className={styles.info}>
        <Link href={isOutOfStock ? '#' : `/product/${slug || id}`} className={styles.name}>
          <img src="/images/mall_ori.webp" alt="Mall Ori" className={styles.mallBadge} />
          {name}
        </Link>
        <div className={styles.priceRow}>
          <span className={styles.price}>Rp {formatRp(displayPrice)}</span>
          {hasDiscount && <span className={styles.oldPrice}>Rp {formatRp(price)}</span>}
        </div>
        <div className={styles.ratingSection}>
          <div className={styles.ratingBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f59e0b' }}>star</span>
            {ratingAvg.toFixed(1)}
          </div>
        </div>
      </div>

      <div className={styles.action}>
        {isOutOfStock ? (
          <span className={styles.outOfStockLabel}>Habis</span>
        ) : mounted && qty > 0 ? (
          <DgQuantitySelector 
            quantity={qty} 
            onChanged={handleQtyChange} 
            max={stockQty}
            compact
          />
        ) : (
          <button className={styles.addBtn} onClick={handleAddClick}>
            <span className="material-symbols-outlined">add</span>
            Beli
          </button>
        )}
      </div>
    </div>
  );
}
