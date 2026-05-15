import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ProductDetailContainer from './ProductDetailContainer';
import ProductDetailSkeleton from './ProductDetailSkeleton';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour for SEO metadata
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan | XINBIE',
    };
  }

  const title = `${product.name} | Harga Terbaik di XINBIE`;
  const description = product.description 
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
    : `Beli ${product.name} dengan kualitas terbaik dan harga terjangkau hanya di XINBIE Indonesia.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images && product.images.length > 0 ? [product.images[0].url] : [],
      url: `https://xinbie.com/product/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images && product.images.length > 0 ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContainer slug={slug} />
    </Suspense>
  );
}
