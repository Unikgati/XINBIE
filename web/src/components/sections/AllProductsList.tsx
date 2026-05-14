import React from 'react';
import styles from '@/app/page.module.css';
import InfiniteProductList from "@/components/InfiniteProductList/index";

async function fetchAllProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?limit=8`, {
      cache: 'no-store'
    });
    if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 8, totalPages: 1 } };
    return await res.json();
  } catch (error) {
    console.error('Error fetching all products:', error);
    return { data: [], meta: { total: 0, page: 1, limit: 8, totalPages: 1 } };
  }
}

export default async function AllProductsList() {
  const { data: initialProducts, meta: initialMeta } = await fetchAllProducts();

  if (!initialProducts || initialProducts.length === 0) return null;

  return (
    <section className={styles.productSection}>
      <h2 className={styles.sectionTitle}>Belanja Harianmu 🛒</h2>
      <InfiniteProductList initialProducts={initialProducts} initialMeta={initialMeta} />
    </section>
  );
}
