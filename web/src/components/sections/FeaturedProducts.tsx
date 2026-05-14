import React from 'react';
import styles from '@/app/page.module.css';
import DgProductCard from "@/components/DgProductCard/index";

async function fetchFeatured() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?featured=true&limit=4`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await fetchFeatured();

  if (!products || products.length === 0) return null;

  return (
    <section className={styles.productSection}>
      <h2 className={styles.sectionTitle}>Pilihan XINBIE 🔥</h2>
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
            ratingAvg={product.ratingAvg}
          />
        ))}
      </div>
    </section>
  );
}
