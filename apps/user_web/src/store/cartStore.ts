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
  stockQty: number;
  isUnlimitedStock: boolean;
}

interface CartState {
  items: CartItem[];
  
  /** Add item or increment quantity if already exists */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  
  /** Add multiple items at once */
  addMultipleItems: (items: { item: Omit<CartItem, 'quantity'>; quantity: number }[]) => void;
  
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
      
      addMultipleItems: (newItems) => {
        set((state) => {
          let updatedItems = [...state.items];
          
          newItems.forEach(({ item, quantity }) => {
            const existingIdx = updatedItems.findIndex(i => 
              matchItem(i, item.productId, item.variantId)
            );
            
            if (existingIdx >= 0) {
              updatedItems[existingIdx] = {
                ...updatedItems[existingIdx],
                quantity: updatedItems[existingIdx].quantity + quantity,
              };
            } else {
              updatedItems.push({ ...item, quantity });
            }
          });
          
          return { items: updatedItems };
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

          return state;
        });
        
        // Trigger validation to ensure price is correct after qty change
        get().validateCart();
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

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const authState = (await import('./authStore')).useAuthStore.getState();
          const token = authState.accessToken;

          const res = await fetch(`${apiUrl}/cart/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              items: items.map(i => ({
                productId: i.productId,
                variantId: i.variantId,
                qty: i.quantity,
                unitPrice: i.price, // Send current price to check for changes
              })),
            }),
          });

          if (!res.ok) return [];

          const data = await res.json();
          const validatedItems = data.items; // [{ productId, variantId, isAvailable, unitPrice, isFlashSale, priceChanged, ... }]

          const removedNames: string[] = [];
          const updatedItems: CartItem[] = [];

          for (const item of items) {
            const v = validatedItems.find((vi: any) => 
              vi.productId === item.productId && (vi.variantId || null) === (item.variantId || null)
            );

            if (!v || !v.isAvailable) {
              removedNames.push(item.name);
              continue;
            }

            updatedItems.push({
              ...item,
              price: v.unitPrice,
              stockQty: v.stockQty || item.stockQty,
              imageUrl: v.productImage || item.imageUrl,
            });
          }

          set({ items: updatedItems });
          return removedNames;
        } catch (err) {
          console.error('Validate cart failed:', err);
          return [];
        }
      },
    }),
    {
      name: 'dapurgizi-cart',
    }
  )
);
