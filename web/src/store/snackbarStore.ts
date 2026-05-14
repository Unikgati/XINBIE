import { create } from 'zustand';

interface SnackbarState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  show: (message: string, type?: 'success' | 'error' | 'info') => void;
  hide: () => void;
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  message: '',
  type: 'info',
  isVisible: false,
  show: (message, type = 'success') => {
    set({ message, type, isVisible: true });
    // Auto hide after 3 seconds
    setTimeout(() => {
      set({ isVisible: false });
    }, 3000);
  },
  hide: () => set({ isVisible: false }),
}));
