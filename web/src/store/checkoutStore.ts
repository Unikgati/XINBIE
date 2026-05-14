import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

interface CheckoutState {
  paymentMethod: string | null;
  scheduledDate: string | null; // Store as ISO string
  deliverySlot: DeliverySlot | null;
  
  setPaymentMethod: (method: string | null) => void;
  setScheduledDate: (date: Date | null) => void;
  setDeliverySlot: (slot: DeliverySlot | null) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      paymentMethod: null,
      scheduledDate: null,
      deliverySlot: null,

      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setScheduledDate: (date) => set({ scheduledDate: date ? date.toISOString() : null }),
      setDeliverySlot: (slot) => set({ deliverySlot: slot }),
      clearCheckout: () => set({ paymentMethod: null, scheduledDate: null, deliverySlot: null }),
    }),
    {
      name: 'xinbie-checkout',
    }
  )
);
