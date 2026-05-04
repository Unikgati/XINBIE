import React from 'react';
import ProductDetailClient from './ProductDetailClient';

async function fetchApi(endpoint: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const product = await fetchApi(`/products/${id}`);

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', minHeight: '60vh' }}>
        <h2>Produk tidak ditemukan</h2>
        <p>Maaf, produk yang Anda cari tidak tersedia atau telah dihapus.</p>
        <a href="/" style={{ color: 'var(--color-primary-dark)', textDecoration: 'underline' }}>
          Kembali ke Beranda
        </a>
      </div>
    );
  }

  // Fetch related products from same category, exclude current product
  let relatedProducts: any[] = [];
  if (product.categoryId) {
    const relatedRes = await fetchApi(`/products?categoryId=${product.categoryId}&limit=8`);
    if (relatedRes?.data) {
      relatedProducts = relatedRes.data.filter((p: any) => p.id !== product.id);
    }
  }

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
