import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import DgProductCard from '@/components/DgProductCard';

async function fetchApi(endpoint: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

export default async function CategoryPage({ params, searchParams }: { params: { slug: string }, searchParams: { name?: string } }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  let categoryName = resolvedSearchParams.name || 'Kategori';
  let categoryIcon = '';
  let categoryColor = '#4caf50';
  let categoryId = '';

  const categories = await fetchApi('/categories');
  if (categories) {
    const cat = categories.find((c: any) => c.slug === slug);
    if (cat) {
      categoryId = cat.id;
      if (!resolvedSearchParams.name) {
        categoryName = cat.name;
      }
      categoryIcon = cat.iconUrl || '';
      categoryColor = cat.bgColor || '#4caf50';
    }
  }

  const productsRes = categoryId ? await fetchApi(`/products?categoryId=${categoryId}&limit=50`) : { data: [] };
  const products = productsRes?.data || [];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">Beranda</Link> &gt; <span style={{ color: 'var(--color-text-primary)' }}>{categoryName}</span>
        </div>

        <h2 className={styles.sectionTitle}>{categoryName}</h2>

        {/* Product Grid */}
        {products.length > 0 ? (
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
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>
                inventory_2
              </span>
            </div>
            <h2>Kategori Kosong</h2>
            <p>Belum ada produk di kategori ini.</p>
          </div>
        )}
      </div>
    </main>
  );
}
