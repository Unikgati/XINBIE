'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import DgRecipeCard from '@/components/DgRecipeCard';
import DgSkeleton from '@/components/DgSkeleton';
import styles from '@/app/resep/ResepPage.module.css';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  heroImage?: string;
  _count?: {
    steps: number;
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  initialRecipes: Recipe[];
  initialMeta: Meta;
}

export default function InfiniteRecipeList({ initialRecipes, initialMeta }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialMeta.page < initialMeta.totalPages);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  const loadMoreRecipes = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    const nextPage = meta.page + 1;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Add a small timeout to fetch to prevent infinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${apiUrl}/recipes?page=${nextPage}&limit=${meta.limit}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const json = await res.json();
      const newRecipes = json.data || [];
      const newMeta = json.meta || { ...meta, page: nextPage };

      setRecipes((prev) => [...prev, ...newRecipes]);
      setMeta(newMeta);
      setHasMore(newMeta.page < newMeta.totalPages);
    } catch (err: any) {
      console.error('Error loading more recipes:', err);
      setError(err.name === 'AbortError' ? 'Koneksi lambat. Silakan coba lagi.' : 'Gagal memuat resep tambahan.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, meta]);

  useEffect(() => {
    if (inView && hasMore && !loading && !error) {
      loadMoreRecipes();
    }
  }, [inView, hasMore, loading, error, loadMoreRecipes]);

  return (
    <>
      <div className={styles.grid}>
        {recipes.map((recipe) => (
          <DgRecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {loading && (
        <div className={styles.loaderContainer} style={{ marginTop: '32px' }}>
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <DgSkeleton width="100%" height="auto" borderRadius="16px" style={{ aspectRatio: '1/1' }} />
                <DgSkeleton width="90%" height="18px" />
                <DgSkeleton width="50%" height="14px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px 24px', background: '#fff1f0', borderRadius: '16px', margin: '32px 0', border: '1px solid #ffa39e' }}>
          <p style={{ color: '#cf1322', fontWeight: 600, marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => loadMoreRecipes()}
            style={{ 
              padding: '10px 24px', 
              background: 'var(--color-primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '100px', 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!hasMore && !error && recipes.length > 0 && (
        <div className={styles.endMessage} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          ✨ Anda telah melihat semua inspirasi resep kami
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {hasMore && !loading && !error && <div ref={ref} style={{ height: '20px' }} />}
    </>
  );
}
