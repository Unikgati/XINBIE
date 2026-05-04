import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;         // active price (after discount if any)
  originalPrice: number; // original price before discount
  unit: string;
  imageUrl?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  
  /** Add item or increment quantity if already exists */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  
  /** Update quantity for specific product+variant combo */
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  
  /** Remove item entirely */
  removeItem: (productId: string, variantId?: string | null) => void;
  
  /** Get quantity for specific product+variant */
  getQuantity: (productId: string, variantId?: string | null) => number;
  
  /** Get cart item for specific product+variant */
  getItem: (productId: string, variantId?: string | null) => CartItem | undefined;
  
  /** Total unique items in cart */
  totalItems: () => number;
  
  /** Total quantity of all items */
  totalQuantity: () => number;
  
  /** Grand total price */
  totalPrice: () => number;
  
  /** Clear entire cart */
  clearCart: () => void;

  /** Validate cart items against backend, remove stale/invalid items */
  validateCart: () => Promise<string[]>;
}

const matchItem = (item: CartItem, productId: string, variantId?: string | null) =>
  item.productId === productId && (item.variantId || null) === (variantId || null);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (itemData, quantity = 1) => {
        set((state) => {
          const existingIdx = state.items.findIndex(i => 
            matchItem(i, itemData.productId, itemData.variantId)
          );

          if (existingIdx >= 0) {
            const updated = [...state.items];
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + quantity,
            };
            return { items: updated };
          }

          return {
            items: [...state.items, { ...itemData, quantity }],
          };
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(i => !matchItem(i, productId, variantId)),
            };
          }

          const existingIdx = state.items.findIndex(i => matchItem(i, productId, variantId));
          if (existingIdx >= 0) {
            const updated = [...state.items];
            updated[existingIdx] = { ...updated[existingIdx], quantity };
            return { items: updated };
          }

          return state; // item not found, no-op
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(i => !matchItem(i, productId, variantId)),
        }));
      },

      getQuantity: (productId, variantId) => {
        const item = get().items.find(i => matchItem(i, productId, variantId));
        return item?.quantity || 0;
      },

      getItem: (productId, variantId) => {
        return get().items.find(i => matchItem(i, productId, variantId));
      },

      totalItems: () => get().items.length,

      totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      clearCart: () => set({ items: [] }),

      validateCart: async () => {
        const { items } = get();
        if (items.length === 0) return [];

        const removedNames: string[] = [];
        const validItems: CartItem[] = [];

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        for (const item of items) {
          try {
            const res = await fetch(`${apiUrl}/products/${item.productId}`);
            if (!res.ok) {
              removedNames.push(item.name);
              continue;
            }
            const product = await res.json();
            // Check if product is still active and in stock
            if (!product.isActive) {
              removedNames.push(item.name);
              continue;
            }
            if (!product.isUnlimitedStock && product.stockQty <= 0) {
              removedNames.push(item.name);
              continue;
            }
            // Update price if changed
            validItems.push({
              ...item,
              price: product.discountPrice || product.price,
              originalPrice: product.price,
              imageUrl: product.images?.[0] || item.imageUrl,
            });
          } catch {
            // Network error — keep item, don't remove
            validItems.push(item);
          }
        }

        if (removedNames.length > 0) {
          set({ items: validItems });
        }

        return removedNames;
      },
    }),
    {
      name: 'dapurgizi-cart',
    }
  )
);
