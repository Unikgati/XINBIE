import React, { Suspense } from 'react';
import styles from './page.module.css';
import CategoryHeader from './CategoryHeader';
import CategoryProductGrid from './CategoryProductGrid';
import { ProductGridSkeleton } from '@/components/sections/Skeletons';
import DgSkeleton from '@/components/DgSkeleton';

export default async function CategoryPage({ params, searchParams }: { params: { slug: string }, searchParams: { name?: string } }) {
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
            <div style={{ height: '16px' }} />
            <DgSkeleton width="200px" height="32px" borderRadius="8px" />
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
