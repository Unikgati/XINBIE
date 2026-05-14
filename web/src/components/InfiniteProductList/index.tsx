'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import DgProductCard from '@/components/DgProductCard';
import styles from '@/app/page.module.css';

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  unit: string;
  images?: string[];
  discountPrice?: number;
  discountPercent?: number;
  isUnlimitedStock: boolean;
  stockQty: number;
  tags?: string[];
  variants?: any[];
  ratingAvg?: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  initialProducts: Product[];
  initialMeta: Meta;
}

export default function InfiniteProductList({ initialProducts, initialMeta }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(initialMeta.page);
  const [hasMore, setHasMore] = useState(initialMeta.page < initialMeta.totalPages);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      const nextPage = page + 1;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?limit=8&page=${nextPage}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setProducts(prev => [...prev, ...data.data]);
      setPage(nextPage);
      setHasMore(nextPage < data.meta.totalPages);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!products || products.length === 0) {
    return <p className={styles.emptyText}>Tidak ada produk.</p>;
  }

  return (
    <>
      <div className={styles.productGrid}>
        {products.map((product, index) => {
          const isLast = index === products.length - 1;
          return (
            <div key={product.id} ref={isLast ? lastProductElementRef : null}>
              <DgProductCard
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                unit={product.unit}
                imageUrl={product.images && product.images.length > 0 ? product.images[0] : undefined}
                discountPrice={product.discountPrice}
                discountPercent={product.discountPercent}


                variantCount={product.variants ? product.variants.length : 0}
                tags={product.tags}
                ratingAvg={product.ratingAvg}
              />
            </div>
          );
        })}
      </div>
      
      {loading && (
        <div className={styles.productGrid} style={{ marginTop: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={`shimmer-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="shimmer shimmer-rounded" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px' }}></div>
              <div className="shimmer shimmer-rounded" style={{ width: '80%', height: '16px', marginTop: '8px' }}></div>
              <div className="shimmer shimmer-rounded" style={{ width: '50%', height: '14px' }}></div>
              <div className="shimmer shimmer-rounded" style={{ width: '100%', height: '36px', marginTop: '8px', borderRadius: '8px' }}></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
