import React from 'react';
import styles from './page.module.css';
import DgProductCard from '@/components/DgProductCard';
import DgEmptyState from '@/components/DgEmptyState';

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
      <DgEmptyState 
        icon="search_off"
        title="Kategori Tidak Ditemukan"
        subtitle="Maaf, kategori yang Anda cari tidak tersedia atau sudah dihapus."
        actionLabel="Kembali ke Beranda"
        actionHref="/"
      />
    );
  }

  const products = await fetchProductsByCategory(categoryId);

  if (products.length === 0) {
    return (
      <DgEmptyState 
        icon="inventory_2"
        title="Kategori Kosong"
        subtitle="Belum ada produk di kategori ini. Cek kembali nanti ya!"
        actionLabel="Cari Produk Lain"
        actionHref="/"
      />
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

          variantCount={product.variants ? product.variants.length : 0}
          tags={product.tags}
        />
      ))}
    </div>
  );
}
