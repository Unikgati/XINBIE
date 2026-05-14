'use client';

import React from 'react';
import { useCartStore } from '@/store/cartStore';
import { useSnackbarStore } from '@/store/snackbarStore';
import { useRouter } from 'next/navigation';

interface Ingredient {
  product?: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    unit: string;
    images?: string[];
    stockQty: number;
    isUnlimitedStock: boolean;
  };
}

export default function BuyAllIngredients({ ingredients }: { ingredients: Ingredient[] }) {
  const addMultipleItems = useCartStore((s) => s.addMultipleItems);
  const snackbar = useSnackbarStore();
  const router = useRouter();

  const shoppable = ingredients.filter(i => i.product && i.product.stockQty > 0);

  if (shoppable.length === 0) return null;

  const handleBuyAll = () => {
    const items = shoppable.map(i => {
      const p = i.product!;
      return {
        item: {
          productId: p.id,
          variantId: null,
          name: p.name,
          price: p.discountPrice || p.price,
          originalPrice: p.price,
          unit: p.unit,
          imageUrl: p.images?.[0],
          stockQty: p.stockQty,
          isUnlimitedStock: p.isUnlimitedStock,
        },
        quantity: 1
      };
    });

    addMultipleItems(items);
    snackbar.show(`${items.length} bahan berhasil masuk keranjang`, 'success');
    router.push('/cart');
  };

  return (
    <button 
      onClick={handleBuyAll}
      style={{
        width: '100%',
        background: 'var(--primary)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '14px',
        fontWeight: '800',
        fontSize: '15px',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
      }}
    >
      <span className="material-symbols-outlined">shopping_cart_checkout</span>
      Beli Semua Bahan Tersedia
    </button>
  );
}
