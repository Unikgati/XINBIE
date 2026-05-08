import React from 'react';
import styles from '@/app/page.module.css';
import DgProductCard from "@/components/DgProductCard/index";

async function fetchPromo() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?promo=true&limit=4`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching promo products:', error);
    return [];
  }
}

export default async function PromoProducts() {
  const products = await fetchPromo();

  if (!products || products.length === 0) return null;

  return (
    <section className={styles.productSection}>
      <h2 className={styles.sectionTitle}>Spesial Diskon 💸</h2>
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
            isOutOfStock={product.stockQty <= 0}
            stockQty={product.stockQty}
            isUnlimitedStock={product.isUnlimitedStock}
            variantCount={product.variants ? product.variants.length : 0}
            tags={product.tags}
          />
        ))}
      </div>
    </section>
  );
}
