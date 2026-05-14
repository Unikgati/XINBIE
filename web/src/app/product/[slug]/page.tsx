import React, { Suspense } from 'react';
import ProductDetailContainer from './ProductDetailContainer';
import ProductDetailSkeleton from './ProductDetailSkeleton';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContainer slug={slug} />
    </Suspense>
  );
}
