import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import DgProductRow from '@/components/DgProductRow';
import Breadcrumbs from '@/components/Breadcrumbs';
import DgEmptyState from '@/components/DgEmptyState';
import styles from './RecipeDetail.module.css';

async function getRecipe(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const res = await fetch(`${apiUrl}/recipes/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) return { title: 'Resep Tidak Ditemukan' };
  return {
    title: `${recipe.title} - Dapurgizi`,
    description: `Cara memasak ${recipe.title} dengan bahan segar dari Dapurgizi.`,
    openGraph: {
      images: recipe.heroImage ? [recipe.heroImage] : [],
    },
  };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) {
    return (
      <div className={styles.container}>
        <main className={styles.main} style={{ paddingTop: 60 }}>
          <DgEmptyState 
            icon="sentiment_dissatisfied"
            title="Resep tidak ditemukan"
            subtitle="Maaf, resep yang Anda cari mungkin sudah dihapus atau dipindahkan."
            actionLabel="Lihat Resep Lainnya"
            actionHref="/resep"
          />
        </main>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Inspirasi Resep', href: '/resep' },
    { label: recipe.title },
  ];

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Breadcrumbs items={breadcrumbItems} className={styles.breadcrumbs} />

        <div className={styles.splitLayout}>
          {/* SISI KIRI: Foto & Bahan */}
          <aside className={styles.sidebar}>
            <div className={styles.stickySidebar}>
              <div className={styles.heroImageWrapper}>
                <img src={recipe.heroImage || '/placeholder-recipe.jpg'} alt={recipe.title} className={styles.heroImage} />
              </div>
              
              <div className={styles.ingredientsBox}>
                <h2 className={styles.sidebarTitle}>Bahan Masakan</h2>
                <p className={styles.sidebarSubtitle}>Beli bahan segar ini di Dapurgizi</p>
                
                <div className={styles.productsList}>
                  {recipe.products && recipe.products.length > 0 ? (
                    recipe.products.map((product: any) => (
                      <DgProductRow 
                        key={product.id} 
                        id={product.id}
                        slug={product.slug}
                        name={product.name}
                        price={product.price}
                        unit={product.unit}
                        imageUrl={product.images?.[0]}
                        discountPrice={product.discountPrice}
                        discountPercent={product.discountPercent}
                        tags={product.tags}
                        stockQty={product.stockQty}
                        isUnlimitedStock={product.isUnlimitedStock}
                      />
                    ))
                  ) : (
                    <p className={styles.noProducts}>Bahan masakan belum ditautkan.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* SISI KANAN: Judul & Langkah */}
          <article className={styles.content}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <div className={styles.metaInfo}>
              <span className="material-symbols-outlined">restaurant_menu</span>
              {recipe.steps?.length || 0} Langkah Memasak
            </div>

            <section className={styles.stepsSection}>
              <h2 className={styles.sectionTitle}>Cara Membuat</h2>
              <div className={styles.stepsList}>
                {recipe.steps?.map((step: any, idx: number) => (
                  <div key={step.id} className={styles.stepItem}>
                    <div className={styles.stepNumber}>{idx + 1}</div>
                    <div className={styles.stepContent}>
                      <p className={styles.stepInstruction}>{step.instruction}</p>
                      {step.imageUrl && (
                        <div className={styles.stepImageWrapper}>
                          <img src={step.imageUrl} alt={`Langkah ${idx + 1}`} className={styles.stepImage} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
