'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import styles from './ProductDetail.module.css';
import DgQuantitySelector from '@/components/DgQuantitySelector';
import DgProductCard from '@/components/DgProductCard';
import { useCartStore } from '@/store/cartStore';

interface Variant {
  id: string;
  name: string;
  price?: number;
  discountPrice?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId?: string;
  categoryName: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  unit: string;
  images?: string[];
  isUnlimitedStock: boolean;
  stockQty: number;
  variants: Variant[];
}

export default function ProductDetailClient({ product, relatedProducts = [] }: { product: Product; relatedProducts?: any[] }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants?.length > 0 ? product.variants[0] : null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isCollapsible, setIsCollapsible] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (descRef.current) {
      if (descRef.current.scrollHeight > 140) {
        setIsCollapsible(true);
      }
    }
  }, [product.description]);

  // Cart store
  const cartQty = useCartStore((s) => s.getQuantity(product.id, selectedVariant?.id));
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // SSR-safe: start at 1, sync from cart after mount
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setMounted(true);
    if (cartQty > 0) setQuantity(cartQty);
  }, [cartQty]);

  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const images = product.images?.length ? product.images : [];
  const mainImage = images.length > 0 ? images[activeImageIndex] : null;

  let basePrice = product.price;
  let finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : basePrice;

  if (selectedVariant && selectedVariant.price && selectedVariant.price > 0) {
    basePrice = selectedVariant.price;
    finalPrice = selectedVariant.discountPrice && selectedVariant.discountPrice > 0 ? selectedVariant.discountPrice : basePrice;
  }

  const hasDiscount = finalPrice < basePrice;
  const displayPrice = finalPrice;
  const calculatedDiscountPercent = hasDiscount ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

  const isOutOfStock = !product.isUnlimitedStock && product.stockQty <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    if (cartQty > 0) {
      // Already in cart → update quantity
      updateQuantity(product.id, quantity, selectedVariant?.id);
    } else {
      // New item
      addItem({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        name: product.name + (selectedVariant ? ` (${selectedVariant.name})` : ''),
        price: displayPrice,
        originalPrice: basePrice,
        unit: product.unit,
        imageUrl: images[0],
      }, quantity);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/">Beranda</Link> &gt; <Link href={`/category/${product.categoryName}`}>{product.categoryName || 'Produk'}</Link> &gt; <span style={{color: 'var(--color-text-primary)'}}>{product.name}</span>
      </div>

      <div className={styles.grid}>
        {/* Left: Images */}
        <div className={styles.imageSection}>
          <div className={styles.mainImageWrapper}>
            {mainImage ? (
              <Image 
                src={mainImage} 
                alt={product.name} 
                fill 
                style={{ objectFit: 'cover' }} 
                unoptimized
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

        {/* Right: Info */}
        <div className={styles.infoSection}>
          <div className={styles.headerGroup}>
            <div className={styles.categoryBadge}>{product.categoryName || 'Produk'}</div>
            <h1 className={styles.title}>{product.name}</h1>
            
            <div className={styles.priceContainer}>
              <span className={styles.activePrice}>Rp {formatRp(displayPrice)}</span>
              {hasDiscount && (
                <div className={styles.discountBox}>
                  <span className={styles.discountBadge}>{calculatedDiscountPercent}% OFF</span>
                  <span className={styles.strikethroughPrice}>Rp {formatRp(basePrice)}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.metaInfo}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Satuan</span>
              <span className={styles.metaValue}>1 {product.unit}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Stok</span>
              <span className={styles.metaValue} style={{ color: isOutOfStock ? 'var(--color-error)' : 'var(--color-success)' }}>
                {isOutOfStock ? 'Habis' : (product.isUnlimitedStock ? 'Tersedia' : `Sisa ${product.stockQty}`)}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          {product.variants && product.variants.length > 0 && (
            <div className={styles.variantsSection}>
              <h3 className={styles.sectionTitle}>Pilih Varian:</h3>
              <div className={styles.variantsGrid}>
                {product.variants.map(v => {
                  const isDiscounted = v.discountPrice != null && v.price != null && v.discountPrice > 0 && v.discountPrice < v.price;
                  return (
                    <button 
                      key={v.id} 
                      className={`${styles.variantButton} ${selectedVariant?.id === v.id ? styles.variantButtonActive : ''}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.name}
                      {isDiscounted && (
                        <div className={styles.variantDiscountCorner}>%</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.actionSection}>
            <DgQuantitySelector 
              quantity={quantity} 
              onChanged={setQuantity} 
              min={1} 
              max={product.isUnlimitedStock ? 99 : product.stockQty}
              large
              editable
            />
            <button className={styles.addToCartBtn} disabled={isOutOfStock} onClick={handleAddToCart}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {isOutOfStock ? 'Stok Habis' : `Tambah ke Keranjang — Rp ${formatRp(displayPrice * quantity)}`}
            </button>
          </div>

          <div className={styles.descriptionSection}>
            <h3 className={styles.sectionTitle}>Deskripsi Produk</h3>
            {product.description ? (
              <div className={styles.descriptionContainer}>
                <div 
                  ref={descRef}
                  className={`${styles.descriptionHtml} ${!isDescExpanded && isCollapsible ? styles.collapsed : ''}`}
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(product.description.replace(/&nbsp;/g, ' ')) 
                  }} 
                />
                {!isDescExpanded && isCollapsible && <div className={styles.descriptionFade} />}
                {isCollapsible && (
                  <button 
                    className={styles.toggleDescBtn} 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? 'Tutup Deskripsi' : 'Baca Selengkapnya'}
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {isDescExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <p className={styles.descriptionText}>Tidak ada deskripsi.</p>
            )}
          </div>

        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.divider} />
          <h2 className={styles.relatedTitle}>Produk Terkait</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p: any) => (
              <DgProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                unit={p.unit}
                imageUrl={p.images && p.images.length > 0 ? p.images[0] : undefined}
                discountPrice={p.discountPrice}
                discountPercent={p.discountPercent}
                isOutOfStock={!p.isUnlimitedStock && p.stockQty <= 0}
                variantCount={p.variants ? p.variants.length : 0}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
