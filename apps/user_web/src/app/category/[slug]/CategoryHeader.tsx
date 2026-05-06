import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

async function fetchCategoryMetadata(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    const categories = await res.json();
    return categories.find((c: any) => c.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching category metadata:', error);
    return null;
  }
}

export default async function CategoryHeader({ slug, initialName }: { slug: string, initialName?: string }) {
  const cat = await fetchCategoryMetadata(slug);
  const name = initialName || cat?.name || 'Kategori';

  return (
    <>
      <div className={styles.breadcrumb}>
        <Link href="/">Beranda</Link> &gt; <span style={{ color: 'var(--color-text-primary)' }}>{name}</span>
      </div>
      <h2 className={styles.sectionTitle}>{name}</h2>
    </>
  );
}
