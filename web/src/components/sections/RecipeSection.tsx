import React from 'react';
import Link from 'next/link';
import DgRecipeCard from '../DgRecipeCard';
import styles from './RecipeSection.module.css';

async function getRecipes() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/recipes?limit=4`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

export default async function RecipeSection() {
  const recipes = await getRecipes();

  if (recipes.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Inspirasi Masak Hari Ini</h2>
        <Link href="/resep" className={styles.seeAll}>
          Lihat Semua
        </Link>
      </div>

      <div className={styles.grid}>
        {recipes.map((recipe: any) => (
          <DgRecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}
