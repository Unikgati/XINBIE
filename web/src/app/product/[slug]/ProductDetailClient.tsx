'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './ProductDetail.module.css';
import DgProductCard from '@/components/DgProductCard';
import ProductImageGallery from './ProductImageGallery';
import CookingVideoSection from './CookingVideoSection';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Variant {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  stockQty: number;
}

interface CookingVideo {
  id: string;
  title: string;
  youtubeUrl: string;
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
  tags?: string[];
  sizes?: string[];
  variants: Variant[];
  cookingVideos?: CookingVideo[];
  shopeeUrl?: string;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: any[];
  similarProducts: any[];
}

export default function ProductDetailClient({ product, relatedProducts, similarProducts }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
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

  const formatRp = (n: number) => {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const images = product.images?.length ? product.images : [];

  let basePrice = product.price;
  let finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : basePrice;

  if (selectedVariant && selectedVariant.price && selectedVariant.price > 0) {
    basePrice = selectedVariant.price;
    finalPrice = selectedVariant.discountPrice && selectedVariant.discountPrice > 0 ? selectedVariant.discountPrice : basePrice;
  }

  const hasDiscount = finalPrice < basePrice;
  const displayPrice = finalPrice;
  const calculatedDiscountPercent = hasDiscount ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

  const handleShare = async () => {
    const url = window.location.href;
    const title = product.name;
    const text = `Cek produk ${product.name} di XINBIE!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handleBuyOnShopee = () => {
    if (product.shopeeUrl) {
      window.open(product.shopeeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={styles.container}>
      <Breadcrumbs 
        items={[
          { label: 'Beranda', href: '/' },
          { label: product.categoryName || 'Produk', href: `/category/${product.categoryName}` },
          { label: product.name }
        ]} 
      />

      <div className={styles.grid}>
        {/* Left: Images */}
        <ProductImageGallery 
          images={images} 
          name={product.name} 
          variantImage={selectedVariant?.imageUrl}
        />

        {/* Right: Info */}
        <div className={styles.infoSection}>
          <div className={styles.headerGroup}>
            <div className={styles.categoryBadge}>{product.categoryName || 'Produk'}</div>
            <div className={styles.titleWrapper}>
            <h1 className={styles.title}>
              <img src="/images/mall_ori.webp" alt="Mall Ori" className={styles.mallBadge} />
              {product.name}
            </h1>
            <div className={styles.shareActions}>
              <button onClick={handleShare} className={styles.shareBtn} title="Bagikan Produk">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>share</span>
              </button>
            </div>
          </div>

          <div className={styles.ratingGroup}>
            <div className={styles.ratingItem}>
              <span className={styles.ratingValue}>{product.ratingAvg?.toFixed(1) || '4.8'}</span>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="material-symbols-outlined" style={{ 
                    fontSize: 18, 
                    color: i <= Math.round(product.ratingAvg || 4.8) ? '#f59e0b' : '#e5e7eb',
                    fontVariationSettings: "'FILL' 1"
                  }}>star</span>
                ))}
              </div>
            </div>
          </div>
        </div>
            
            <div className={styles.priceContainer}>
              <span className={styles.activePrice}>Rp {formatRp(displayPrice)}</span>
              
              <div className={styles.discountBox}>
                {hasDiscount && (
                  <>
                    <span className={styles.discountBadge}>{calculatedDiscountPercent}% OFF</span>
                    <span className={styles.strikethroughPrice}>Rp {formatRp(basePrice)}</span>
                  </>
                )}
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className={styles.tagsRow}>
                {product.tags.map(tag => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

          <div className={styles.divider} />

          {product.variants && product.variants.length > 0 && (
            <div className={styles.variantsSection}>
              <h3 className={styles.sectionTitle}>Varian Tersedia:</h3>
              <div className={styles.variantsGrid}>
                {product.variants.map(v => {
                  const isDiscounted = v.discountPrice != null && v.price != null && v.discountPrice > 0 && v.discountPrice < v.price;
                  return (
                    <button 
                      key={v.id} 
                      className={`${styles.variantButton} ${selectedVariant?.id === v.id ? styles.variantButtonActive : ''}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.imageUrl && (
                        <img 
                          src={v.imageUrl} 
                          alt={v.name} 
                          className={styles.variantThumbnail}
                        />
                      )}
                      <span>{v.name}</span>
                      {isDiscounted && (
                        <div className={styles.variantDiscountCorner}>%</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className={styles.sizesSection}>
              <h3 className={styles.sectionTitle}>Ukuran Tersedia:</h3>
              <div className={styles.sizesGrid}>
                {product.sizes.map(size => (
                  <div key={size} className={styles.sizeBadge}>
                    {size}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionSection}>
            <div className={styles.actionButtonsRow}>
              {product.shopeeUrl ? (
                <button 
                  className={styles.buyNowBtn} 
                  onClick={handleBuyOnShopee}
                  style={{ width: '100%', background: '#EE4D2D', borderColor: '#EE4D2D' }}
                >
                  <img src="/images/shopee_logo.svg" alt="Shopee" className={styles.shopeeIconWhite} />
                  Beli di Shopee
                </button>
              ) : (
                <button 
                  className={styles.buyNowBtn} 
                  disabled
                  style={{ width: '100%', opacity: 0.5 }}
                >
                  Link Shopee belum tersedia
                </button>
              )}
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <h3 className={styles.sectionTitle}>Deskripsi Produk</h3>
            {product.description ? (
              <div className={styles.descriptionContainer}>
                <div 
                  ref={descRef}
                  className={`${styles.descriptionHtml} ${!isDescExpanded && isCollapsible ? styles.collapsed : ''}`}
                  dangerouslySetInnerHTML={{ 
                    __html: product.description 
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
          <h2 className={styles.relatedTitle}>Mungkin Kamu Suka</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p: any) => (
              <DgProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                price={p.price}
                unit={p.unit}
                imageUrl={p.images && p.images.length > 0 ? p.images[0] : undefined}
                discountPrice={p.discountPrice}
                discountPercent={p.discountPercent}
                variantCount={p.variants ? p.variants.length : 0}
                tags={p.tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.divider} />
          <h2 className={styles.relatedTitle}>Produk Terkait</h2>
          <div className={styles.relatedGrid}>
            {similarProducts.map((p: any) => (
              <DgProductCard
                key={`similar-${p.id}`}
                id={p.id}
                slug={p.slug}
                name={p.name}
                price={p.price}
                unit={p.unit}
                imageUrl={p.images && p.images.length > 0 ? p.images[0] : undefined}
                discountPrice={p.discountPrice}
                discountPercent={p.discountPercent}
                variantCount={p.variants ? p.variants.length : 0}
                tags={p.tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cooking Videos Section */}
      <CookingVideoSection videos={product.cookingVideos || []} />

      {/* Mobile Sticky Footer */}
      {product.shopeeUrl && (
        <div className={styles.mobileStickyFooter}>
          <div className={styles.stickyBottomRow}>
            <button 
              className={styles.stickyBuyNowBtn} 
              onClick={handleBuyOnShopee}
              style={{ width: '100%', background: '#EE4D2D', borderColor: '#EE4D2D' }}
            >
                <img src="/images/shopee_logo.svg" alt="Shopee" className={styles.shopeeIconWhite} />
                Beli di Shopee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
