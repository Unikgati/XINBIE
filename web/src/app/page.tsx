import React, { Suspense } from 'react';
import styles from "./page.module.css";
import { Metadata } from "next";

// Sections
import HeroBanners from "@/components/sections/HeroBanners";
import CategoryList from "@/components/sections/CategoryList";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import PromoProducts from "@/components/sections/PromoProducts";
import AllProductsList from "@/components/sections/AllProductsList";

// Skeletons
import { 
  BannerSkeleton, 
  CategorySkeleton, 
  ProductGridSkeleton 
} from "@/components/sections/Skeletons";

export const metadata: Metadata = {
  title: "XINBIE | Solusi Alat Terapi & Kesehatan Keluarga Indonesia",
  description: "XINBIE menyediakan alat terapi kesehatan premium mulai dari korset lutut, sabuk terapi, hingga kebutuhan wellness lainnya dengan harga terjangkau.",
};

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        
        <Suspense fallback={<BannerSkeleton />}>
          <HeroBanners />
        </Suspense>

        <Suspense fallback={<CategorySkeleton />}>
          <CategoryList />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton />}>
          <FeaturedProducts />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton />}>
          <PromoProducts />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton />}>
          <AllProductsList />
        </Suspense>

      </div>
    </main>
  );
}
