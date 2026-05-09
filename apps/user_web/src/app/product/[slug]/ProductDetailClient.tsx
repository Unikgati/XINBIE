'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ProductDetail.module.css';
import DgQuantitySelector from '@/components/DgQuantitySelector';
import DgProductCard from '@/components/DgProductCard';
import { useCartStore } from '@/store/cartStore';
import { useSnackbarStore } from '@/store/snackbarStore';
import ProductImageGallery from './ProductImageGallery';
import CookingVideoSection from './CookingVideoSection';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getSocket } from '@/lib/socket';

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
  variants: Variant[];
  cookingVideos?: CookingVideo[];
  flashSaleItems?: any[];
  recipeIngredients?: { recipe: { id: string; title: string; slug: string; heroImage?: string } }[];
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: any[];
  similarProducts: any[];
}

export default function ProductDetailClient({ product, relatedProducts, similarProducts }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const router = useRouter();
  const snackbar = useSnackbarStore();
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

  let basePrice = product.price;
  let finalPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : basePrice;

  // Flash Sale Price Override
  const activeFlashSale = product.flashSaleItems && product.flashSaleItems.length > 0 ? product.flashSaleItems[0] : null;
  const isFlashSaleActive = !!activeFlashSale;

  // Real-time stock state
  const initialSold = activeFlashSale?.soldQty || 0;
  const initialTotal = activeFlashSale?.flashStock || 0;
  const [realTimeStock, setRealTimeStock] = useState<number>(initialTotal - initialSold);
  const [realTimeSold, setRealTimeSold] = useState<number>(initialSold);

  useEffect(() => {
    if (!isFlashSaleActive || !activeFlashSale) return;

    const socket = getSocket();
    if (!socket) return;

    const handleStockUpdate = (data: { flashSaleItemId: string, soldQty: number, stockQty: number }) => {
      if (data.flashSaleItemId === activeFlashSale.id) {
        setRealTimeStock(data.stockQty - data.soldQty);
        setRealTimeSold(data.soldQty);
      }
    };

    socket.on('flash_sale:stock', handleStockUpdate);

    return () => {
      socket.off('flash_sale:stock', handleStockUpdate);
    };
  }, [isFlashSaleActive, activeFlashSale]);
  
  if (isFlashSaleActive) {
    finalPrice = activeFlashSale.flashPrice;
  }

  if (selectedVariant && selectedVariant.price && selectedVariant.price > 0 && !isFlashSaleActive) {
    basePrice = selectedVariant.price;
    finalPrice = selectedVariant.discountPrice && selectedVariant.discountPrice > 0 ? selectedVariant.discountPrice : basePrice;
  }

  const hasDiscount = finalPrice < basePrice;
  const displayPrice = finalPrice;
  const calculatedDiscountPercent = hasDiscount ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

  // Calculate total stock from all variants for the master display
  const totalVariantStock = product.variants?.reduce((sum, v) => sum + (v.stockQty || 0), 0) || 0;
  
  const isLongDescription = product.description && product.description.length > 200;

  const handleShare = async () => {
    const url = window.location.href;
    const title = product.name;
    const text = `Cek produk segar ${product.name} di DapurGizi!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback for browsers that don't support native share
      navigator.clipboard.writeText(url);
      snackbar.show('Link berhasil disalin', 'success');
    }
  };

  // Effective stock and price based on selection
  const effectiveStock = selectedVariant ? selectedVariant.stockQty : (product.variants?.length > 0 ? totalVariantStock : product.stockQty);
  const isOutOfStock = effectiveStock <= 0;
  const isSelectionMissing = product.variants?.length > 0 && !selectedVariant;

  const handleAddToCart = (): boolean => {
    if (isOutOfStock) return false;

    if (product.variants?.length > 0 && !selectedVariant) {
      snackbar.show('Silakan pilih varian terlebih dahulu', 'warning');
      return false;
    }

    if (cartQty > 0) {
      updateQuantity(product.id, quantity, selectedVariant?.id);
    } else {
      addItem({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        name: product.name + (selectedVariant ? ` (${selectedVariant.name})` : ''),
        price: displayPrice,
        originalPrice: basePrice,
        unit: product.unit,
        imageUrl: images[0],
        stockQty: effectiveStock,
        isUnlimitedStock: product.isUnlimitedStock,
      }, quantity);
    }
    
    snackbar.show('Berhasil ditambahkan ke keranjang', 'success');
    return true;
  };

  const handleBuyNow = () => {
    const success = handleAddToCart();
    if (success) {
      router.push('/cart');
    }
  };

  // Timer logic for Flash Sale
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isFlashSaleActive || !activeFlashSale.flashSale?.endAt) return;

    const calculateTimeLeft = () => {
      const end = new Date(activeFlashSale.flashSale.endAt).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [isFlashSaleActive, activeFlashSale]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  // Progress calculation
  const currentStock = realTimeStock;
  const currentSold = realTimeSold;
  const fsTotalStock = currentStock + currentSold;
  const fsProgress = fsTotalStock > 0 ? (currentSold / fsTotalStock) * 100 : 0;

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
          {isFlashSaleActive && (
            <div className={styles.flashSaleBanner}>
              <div className={styles.fsMainCol}>
                <div className={styles.fsTitleRow}>
                  <span className="material-symbols-outlined">bolt</span>
                  <span className={styles.fsTitleText}>FLASH SALE</span>
                </div>
                <div className={styles.fsProgressWrapper}>
                  <div className={styles.fsProgressBar}>
                    <div 
                      className={styles.fsProgressFill} 
                      style={{ width: `${fsProgress}%` }}
                    />
                  </div>
                  <div className={styles.fsStockText}>Tersisa {currentStock} item</div>
                </div>
              </div>
              <div className={styles.fsTimerCol}>
                <span className={styles.fsTimerLabel}>Berakhir dalam</span>
                <div className={styles.fsTimerBox}>{formatDuration(timeLeft)}</div>
              </div>
            </div>
          )}

          <div className={styles.headerGroup}>
            <div className={styles.categoryBadge}>{product.categoryName || 'Produk'}</div>
            <div className={styles.titleWrapper}>
            <h1 className={styles.title}>{product.name}</h1>
            <div className={styles.shareActions}>
              <button onClick={handleShare} className={styles.shareBtn} title="Bagikan Produk">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>share</span>
              </button>
            </div>
          </div>
            
            <div className={styles.priceContainer}>
              <span className={styles.activePrice}>Rp {formatRp(displayPrice)}</span>
              
              <div className={styles.discountBox}>
                {isFlashSaleActive ? (
                  <>
                    {hasDiscount && (
                      <span className={styles.discountBadge}>{calculatedDiscountPercent}% OFF</span>
                    )}
                    {hasDiscount && (
                      <span className={styles.strikethroughPrice}>Rp {formatRp(basePrice)}</span>
                    )}
                  </>
                ) : (
                  hasDiscount && (
                    <>
                      <span className={styles.discountBadge}>{calculatedDiscountPercent}% OFF</span>
                      <span className={styles.strikethroughPrice}>Rp {formatRp(basePrice)}</span>
                    </>
                  )
                )}
              </div>

              {isFlashSaleActive && activeFlashSale.limitPerUser > 0 && (
                <div style={{ color: '#E65100', fontSize: '12px', fontWeight: 'bold', width: '100%', marginTop: '4px' }}>
                  * Terbatas {activeFlashSale.limitPerUser} per pelanggan
                </div>
              )}
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
                {isOutOfStock ? 'Habis' : `Sisa ${effectiveStock} ${product.unit || ''}`}
                {selectedVariant && <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '4px' }}>(Varian dipilih)</span>}
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

          <div className={styles.actionSection}>
            <DgQuantitySelector 
              quantity={quantity} 
              onChanged={setQuantity} 
              min={1} 
              max={effectiveStock}
              large
              editable
            />
            <div className={styles.actionButtonsRow}>
              <button 
                className={styles.addToCartBtn} 
                disabled={isOutOfStock} 
                onClick={handleAddToCart}
                style={{ opacity: isSelectionMissing ? 0.7 : 1 }}
              >
                {!isOutOfStock && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>}
                {isOutOfStock ? 'Stok Habis' : 'Keranjang'}
              </button>
              <button 
                className={styles.buyNowBtn} 
                disabled={isOutOfStock} 
                onClick={handleBuyNow}
                style={{ opacity: isSelectionMissing ? 0.7 : 1 }}
              >
                {!isOutOfStock && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shopping_bag</span>}
                {isOutOfStock ? 'Stok Habis' : 'Beli Langsung'}
              </button>
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
                isOutOfStock={p.stockQty <= 0}
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
                isOutOfStock={p.stockQty <= 0}
                variantCount={p.variants ? p.variants.length : 0}
                tags={p.tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recipes Using This Product Section */}
      {product.recipeIngredients && product.recipeIngredients.length > 0 && (
        <section className={styles.relatedSection} style={{ background: '#f0f7f0', padding: '40px 0', margin: '40px -20px 0', borderRadius: 0 }}>
          <div className="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
            <h2 className={styles.relatedTitle} style={{ textAlign: 'center', marginBottom: '30px' }}>
              🍳 Inspirasi Resep Terkait
            </h2>
            <div className={styles.relatedGrid}>
              {product.recipeIngredients.map((ri: any) => (
                <Link key={ri.recipe.id} href={`/resep/${ri.recipe.slug}`} className={styles.recipeCard}>
                  <div className={styles.recipeImageWrapper}>
                    <img src={ri.recipe.heroImage} alt={ri.recipe.title} className={styles.recipeImage} />
                  </div>
                  <div className={styles.recipeContent}>
                    <h3 className={styles.recipeTitle}>{ri.recipe.title}</h3>
                    <div className={styles.recipeLink}>
                      Lihat Cara Memasak
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cooking Videos Section */}
      <CookingVideoSection videos={product.cookingVideos || []} />

      {/* Mobile Sticky Footer */}
      <div className={styles.mobileStickyFooter}>
        <div className={styles.stickyTopRow}>
          <div className={styles.stickyPriceCol}>
            <span className={styles.stickyPriceLabel}>Sub total:</span>
            <span className={styles.stickyPriceValue}>Rp {formatRp(displayPrice * quantity)}</span>
          </div>
          <DgQuantitySelector 
            quantity={quantity} 
            onChanged={setQuantity} 
            min={1} 
            max={product.stockQty}
            large
          />
        </div>
        <div className={styles.stickyBottomRow}>
          <button 
            className={styles.stickyAddToCartBtn} 
            disabled={isOutOfStock} 
            onClick={handleAddToCart}
            style={{ opacity: isSelectionMissing ? 0.7 : 1 }}
          >
            {!isOutOfStock && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>}
            {isOutOfStock ? 'Stok Habis' : 'Keranjang'}
          </button>
          <button 
            className={styles.stickyBuyNowBtn} 
            disabled={isOutOfStock} 
            onClick={handleBuyNow}
            style={{ opacity: isSelectionMissing ? 0.7 : 1 }}
          >
            {isOutOfStock ? 'Stok Habis' : 'Beli Langsung'}
          </button>
        </div>
      </div>
    </div>
  );
}
