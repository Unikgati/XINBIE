import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/app/page.module.css';

async function fetchCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function CategoryList() {
  const categories = await fetchCategories();

  if (!categories || categories.length === 0) return null;

  return (
    <section className={styles.categoriesSection}>
      <div className={styles.categoriesBadges}>
        {categories.map((cat: any) => (
          <Link href={`/category/${cat.slug}`} key={cat.id} className={styles.categoryBadge}>
            {cat.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
