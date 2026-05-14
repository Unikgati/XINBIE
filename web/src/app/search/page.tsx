import React, { Suspense } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import DgProductCard from '@/components/DgProductCard';
import DgEmptyState from '@/components/DgEmptyState';
import { ProductGridSkeleton } from '@/components/sections/Skeletons';
import FeaturedProducts from '@/components/sections/FeaturedProducts';

async function fetchSearchResults(query: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?search=${encodeURIComponent(query)}&limit=50`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
}

async function SearchResults({ query }: { query: string }) {
  const products = await fetchSearchResults(query);

  if (products.length === 0) {
    return (
      <>
        <DgEmptyState 
          icon="search_off"
          title="Produk Tidak Ditemukan"
          subtitle={`Maaf, kami tidak menemukan produk dengan kata kunci "${query}". Coba gunakan kata kunci lain.`}
          actionLabel="Kembali ke Beranda"
          actionHref="/"
        />
        <div style={{ marginTop: '40px' }}>
          <FeaturedProducts />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.resultCount}>
        Ditemukan {products.length} produk untuk "{query}"
      </div>
      <div style={{ height: '24px' }} />
      <div className={styles.productGrid}>
        {products.map((product: any) => (
          <DgProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            unit={product.unit}
            imageUrl={product.images && product.images.length > 0 ? product.images[0] : undefined}
            discountPrice={product.discountPrice}
            discountPercent={product.discountPercent}
            isOutOfStock={!product.isUnlimitedStock && product.stockQty <= 0}
            variantCount={product.variants ? product.variants.length : 0}
            tags={product.tags}
          />
        ))}
      </div>
    </>
  );
}

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: { q?: string } 
}) {
  const query = (await searchParams).q || '';

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Beranda</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            <span>Pencarian</span>
          </nav>
        </div>

        <Suspense fallback={<ProductGridSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      </div>
    </main>
  );
}
