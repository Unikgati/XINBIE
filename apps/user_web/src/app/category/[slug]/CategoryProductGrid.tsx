import React from 'react';
import styles from './page.module.css';
import DgProductCard from '@/components/DgProductCard';

async function fetchProductsByCategory(categoryId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?categoryId=${categoryId}&limit=50`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

async function getCategoryIdBySlug(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    const categories = await res.json();
    const cat = categories.find((c: any) => c.slug === slug);
    return cat?.id || null;
  } catch (error) {
    return null;
  }
}

export default async function CategoryProductGrid({ slug }: { slug: string }) {
  const categoryId = await getCategoryIdBySlug(slug);
  
  if (!categoryId) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>
            inventory_2
          </span>
        </div>
        <h2>Kategori Tidak Ditemukan</h2>
      </div>
    );
  }

  const products = await fetchProductsByCategory(categoryId);

  if (products.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>
            inventory_2
          </span>
        </div>
        <h2>Kategori Kosong</h2>
        <p>Belum ada produk di kategori ini.</p>
      </div>
    );
  }

  return (
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
  );
}
