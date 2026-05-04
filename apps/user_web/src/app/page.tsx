import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from "./page.module.css";
import DgProductCard from "@/components/DgProductCard";
import DgBannerCarousel from "@/components/DgBannerCarousel";

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

export default async function Home() {
  const [
    categories, 
    banners, 
    featuredRes, 
    promoRes, 
    allRes
  ] = await Promise.all([
    fetchApi('/categories'),
    fetchApi('/banners'),
    fetchApi('/products?featured=true&limit=4'),
    fetchApi('/products?promo=true&limit=4'),
    fetchApi('/products?limit=8')
  ]);

  const featuredProducts = featuredRes?.data || [];
  const promoProducts = promoRes?.data || [];
  const allProducts = allRes?.data || [];

  const renderProductGrid = (products: any[]) => {
    if (!products || products.length === 0) {
      return <p className={styles.emptyText}>Tidak ada produk.</p>;
    }
    return (
      <div className={styles.productGrid}>
        {products.map((product: any) => (
          <DgProductCard 
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            unit={product.unit}
            imageUrl={product.images && product.images.length > 0 ? product.images[0] : undefined}
            discountPrice={product.discountPrice}
            discountPercent={product.discountPercent}
            isOutOfStock={!product.isUnlimitedStock && product.stockQty <= 0}
            variantCount={product.variants ? product.variants.length : 0}
          />
        ))}
      </div>
    );
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Promo Banners as Hero */}
        <div style={{ marginTop: '24px' }}>
          <DgBannerCarousel banners={banners} />
        </div>
        {/* Categories (Floating) */}
        {categories && categories.length > 0 && (
          <section className={styles.categoriesSection}>
            <div className={styles.categoriesWrapper}>
              {categories.slice(0, 8).map((cat: any) => (
                <Link href={`/category/${cat.id}`} key={cat.id} className={styles.categoryItem}>
                  <div className={styles.categoryIcon} style={{ backgroundColor: `${cat.bgColor}1A` }}>
                    {cat.iconUrl ? (
                      <Image src={cat.iconUrl} alt={cat.name} width={36} height={36} unoptimized />
                    ) : (
                      <span className={styles.fallbackIcon} style={{ color: cat.bgColor }}>★</span>
                    )}
                  </div>
                  <span className={styles.categoryName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}



        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className={styles.productSection}>
            <h2 className={styles.sectionTitle}>Pilihan DapurGizi 🔥</h2>
            {renderProductGrid(featuredProducts)}
          </section>
        )}

        {/* Promo Products */}
        {promoProducts.length > 0 && (
          <section className={styles.productSection}>
            <h2 className={styles.sectionTitle}>Spesial Diskon 💸</h2>
            {renderProductGrid(promoProducts)}
          </section>
        )}

        {/* All Products */}
        <section className={styles.productSection}>
          <h2 className={styles.sectionTitle}>Belanja Harianmu 🛒</h2>
          {renderProductGrid(allProducts)}
        </section>
      </div>
    </main>
  );
}
