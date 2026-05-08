import React from 'react';
import styles from './FlashSaleSection.module.css';
import DgProductCard from "@/components/DgProductCard/index";
import FlashSaleCountdown from './FlashSaleCountdown';
import FlashSaleGrid from './FlashSaleGrid';

async function fetchActiveFlashSale() {
  try {
    // Optimized: Fetching active session WITH items in one go
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flash-sales?status=active`, {
      next: { revalidate: 30 } // Increased revalidate to 30s for better performance
    });
    if (!res.ok) return null;
    const json = await res.json();
    
    // Validate if session has items
    if (Array.isArray(json) && json.length > 0 && json[0].items?.length > 0) {
      return json[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching flash sale:', error);
    return null;
  }
}

export default async function FlashSaleSection() {
  const flashSale = await fetchActiveFlashSale();

  // If no active flash sale, the component returns null and costs nothing to the user's browser
  if (!flashSale) return null;

  return (
    <section className={styles.flashSaleSection}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>bolt</span>
          <h2>{flashSale.title}</h2>
        </div>
        <FlashSaleCountdown endTime={flashSale.endAt} />
      </div>

      <FlashSaleGrid>
        {flashSale.items.map((item: any) => (
          <DgProductCard
            key={item.id}
            id={item.product.id}
            slug={item.product.slug}
            name={item.product.name}
            price={item.product.price}
            unit={item.product.unit || 'pcs'}
            imageUrl={item.product.images && item.product.images.length > 0 ? item.product.images[0] : undefined}
            discountPrice={item.flashPrice}
            discountPercent={Math.round((1 - item.flashPrice / item.product.price) * 100)}
            isOutOfStock={item.soldQty >= item.flashStock}
            stockQty={item.flashStock - item.soldQty}
            isUnlimitedStock={false}
            variantCount={0}
            tags={['Flash Sale']}
          />
        ))}
      </FlashSaleGrid>
    </section>
  );
}
