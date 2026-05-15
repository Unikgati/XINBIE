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
    <section className={`${styles.categoriesSection} categories-section-wrapper`} style={{ overflow: 'hidden' }}>
      <style>{`
        .categories-section-wrapper {
          padding: 16px 0;
        }
        @media (max-width: 768px) {
          .categories-section-wrapper {
            padding: 4px 0 10px;
          }
        }
        .scroll-container {
          display: flex;
          overflow-x: auto;
          scroll-behavior: smooth;
          -ms-overflow-style: none;
          scrollbar-width: none;
          padding: 4px 20px;
          gap: 10px;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
        .category-badge-pill {
          white-space: nowrap;
          flex-shrink: 0;
          background: #f1f5f9;
          color: #475569;
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
        }
        .category-badge-pill:hover {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
      `}</style>
      <div className="scroll-container">
        {categories.map((cat: any) => (
          <Link href={`/category/${cat.slug}`} key={cat.id} className="category-badge-pill">
            {cat.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
