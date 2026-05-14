'use client';

import React, { useState, useEffect } from 'react';
import styles from './FlashSaleSection.module.css';
import DgProductCard from "@/components/DgProductCard/index";
import FlashSaleCountdown from './FlashSaleCountdown';
import FlashSaleGrid from './FlashSaleGrid';
import { getSocket } from '@/lib/socket';

export default function FlashSaleSection() {
  const [flashSale, setFlashSale] = useState<any>(null);
  const [stockUpdates, setStockUpdates] = useState<Record<string, { stock: number, sold: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flash-sales?status=active`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0 && json[0].items?.length > 0) {
            setFlashSale(json[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching flash sale:', error);
      } finally {
        setLoading(false);
      }
    }
    init();

    const socket = getSocket();
    if (socket) {
      const handleStockUpdate = (data: { flashSaleItemId: string, soldQty: number, stockQty: number }) => {
        setStockUpdates(prev => ({
          ...prev,
          [data.flashSaleItemId]: { stock: data.stockQty, sold: data.soldQty }
        }));
      };
      socket.on('flash_sale:stock', handleStockUpdate);
      return () => {
        socket.off('flash_sale:stock', handleStockUpdate);
      };
    }
  }, []);

  if (loading) return null; // Or skeleton
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
        {flashSale.items.map((item: any) => {
          const update = stockUpdates[item.id];
          const displayStock = update ? update.stock : item.flashStock;
          const displaySold = update ? update.sold : item.soldQty;
          
          return (
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
              isOutOfStock={displayStock <= 0}
              stockQty={displayStock}
              isUnlimitedStock={false}
              variantCount={0}
              tags={['Flash Sale']}
            />
          );
        })}
      </FlashSaleGrid>
    </section>
  );
}
