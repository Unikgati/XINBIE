import React from 'react';
import Link from 'next/link';
import styles from './DgRecipeCard.module.css';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  heroImage?: string;
  stepsCount?: number;
  _count?: {
    steps: number;
  };
}

export default function DgRecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/resep/${recipe.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img 
          src={recipe.heroImage || '/placeholder-recipe.jpg'} 
          alt={recipe.title} 
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{recipe.title}</h3>
        <div className={styles.meta} style={{ marginTop: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>format_list_numbered</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            {recipe.stepsCount ?? recipe._count?.steps ?? 0} Langkah Memasak
          </span>
        </div>
      </div>
    </Link>
  );
}
