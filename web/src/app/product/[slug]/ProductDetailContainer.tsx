import React from 'react';
import ProductDetailClient from './ProductDetailClient';
import DOMPurify from 'isomorphic-dompurify';

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error);
    return null;
  }
}

export default async function ProductDetailContainer({ slug }: { slug: string }) {
  const product = await fetchProduct(slug);

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

  const relatedProducts = product.populatedRelatedProducts || [];
  const similarProducts = product.populatedSimilarProducts || [];

  // Sanitize description on the server
  if (product.description) {
    product.description = DOMPurify.sanitize(product.description.replace(/&nbsp;/g, ' '));
  }

  // Prepare Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((img: any) => img.url) || [],
    description: product.description?.replace(/<[^>]*>/g, '').substring(0, 160),
    brand: {
      '@type': 'Brand',
      name: 'XINBIE'
    },
    offers: {
      '@type': 'Offer',
      url: `https://xinbie.com/product/${slug}`,
      priceCurrency: 'IDR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} similarProducts={similarProducts} />
    </>
  );
}
