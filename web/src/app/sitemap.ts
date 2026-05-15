import { MetadataRoute } from 'next';

const BASE_URL = 'https://xinbie.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
    if (res.ok) {
      const categories = await res.json();
      categoryRoutes = categories.map((cat: any) => ({
        url: `${BASE_URL}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Failed to fetch categories');
  }

  // 3. Dynamic Products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products?limit=1000`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const products = data.products || [];
      productRoutes = products.map((prod: any) => ({
        url: `${BASE_URL}/product/${prod.slug}`,
        lastModified: new Date(prod.updatedAt || new Date()),
        changeFrequency: 'daily',
        priority: 0.9,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Failed to fetch products');
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
