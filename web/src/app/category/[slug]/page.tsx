import React, { Suspense } from 'react';
import { Metadata } from 'next';
import styles from './page.module.css';
import CategoryHeader from './CategoryHeader';
import CategoryProductGrid from './CategoryProductGrid';
import { ProductGridSkeleton } from '@/components/sections/Skeletons';
import DgSkeleton from '@/components/DgSkeleton';

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    const categories = await res.json();
    return categories.find((c: any) => c.slug === slug) || null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  const title = category 
    ? `Koleksi ${category.name} Terlengkap | XINBIE`
    : 'Kategori Produk | XINBIE';
  
  const description = category
    ? `Temukan berbagai pilihan produk ${category.name} berkualitas tinggi dengan harga terjangkau di XINBIE Indonesia. Pengiriman cepat dan terpercaya.`
    : 'Jelajahi berbagai kategori produk pilihan di XINBIE Indonesia.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://xinbie.com/category/${slug}`,
    }
  };
}

export default async function CategoryPage({ 
  params, 
  searchParams 
}: { 
  params: { slug: string }, 
  searchParams: { name?: string } 
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Suspense fallback={
          <>
            <div className={styles.breadcrumb}>
              <DgSkeleton width="120px" height="14px" />
            </div>
          </>
        }>
          <CategoryHeader slug={slug} initialName={resolvedSearchParams.name} />
        </Suspense>

        {/* Product Grid */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <CategoryProductGrid slug={slug} />
        </Suspense>
      </div>
    </main>
  );
}
