import React from 'react';
import DgBannerCarousel from "@/components/DgBannerCarousel/index";

async function fetchBanners() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banners`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

export default async function HeroBanners() {
  const banners = await fetchBanners();

  if (!banners || banners.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <DgBannerCarousel banners={banners} />
    </div>
  );
}
