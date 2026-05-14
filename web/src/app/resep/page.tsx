import React, { Suspense } from 'react';
import { Metadata } from 'next';
import DgBreadcrumbs from '@/components/Breadcrumbs';
import DgEmptyState from '@/components/DgEmptyState';
import DgSkeleton from '@/components/DgSkeleton';
import InfiniteRecipeList from '@/components/InfiniteRecipeList';
import styles from './ResepPage.module.css';

export const metadata: Metadata = {
  title: 'Inspirasi Resep | Dapurgizi',
  description: 'Temukan berbagai inspirasi memasak dengan bahan segar dari Dapurgizi.',
};

// Fetch initial data for SSR
async function getInitialRecipes() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/recipes?page=1&limit=8`, { cache: 'no-store' });
    
    if (!res.ok) {
      return { 
        data: [], 
        meta: { total: 0, page: 1, limit: 8, totalPages: 0 } 
      };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching initial recipes:', error);
    return { 
      data: [], 
      meta: { total: 0, page: 1, limit: 8, totalPages: 0 } 
    };
  }
}

// Actual content component
async function RecipeContent() {
  const { data, meta } = await getInitialRecipes();

  if (!data || data.length === 0) {
    return (
      <DgEmptyState 
        title="Belum Ada Inspirasi Resep" 
        subtitle="Tim kami sedang menyiapkan resep-resep lezat untuk Anda. Kembali lagi nanti ya!" 
      />
    );
  }

  return <InfiniteRecipeList initialRecipes={data} initialMeta={meta} />;
}

// Skeleton during the very first page load
function RecipePageSkeleton() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DgSkeleton width="100%" height="auto" borderRadius="16px" style={{ aspectRatio: '1/1' }} />
          <DgSkeleton width="90%" height="18px" />
          <DgSkeleton width="50%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export default function ResepPage() {
  const breadcrumbItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Inspirasi Resep', href: '/resep', active: true },
  ];

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.breadcrumbs}>
          <DgBreadcrumbs items={breadcrumbItems} />
        </div>
        
        <div className={styles.gridSection}>
          <Suspense fallback={<RecipePageSkeleton />}>
            <RecipeContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
