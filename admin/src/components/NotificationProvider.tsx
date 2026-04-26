'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { connectSocket, disconnectSocket, getSocket, onSocketStatusChange } from '@/lib/socket';
import type { SocketStatus } from '@/lib/socket';
import { getAuthToken } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { usePathname } from 'next/navigation';

interface OrderNotification {
  id: string;
  code: string;
  customerName: string;
  grandTotal: number;
  paymentMethod: string;
  createdAt: string;
}

interface NotificationContextType {
  pendingCount: number;
  resetPendingCount: () => void;
  notifications: OrderNotification[];
  socketStatus: SocketStatus;
}

const NotificationContext = createContext<NotificationContextType>({
  pendingCount: 0,
  resetPendingCount: () => {},
  notifications: [],
  socketStatus: 'disconnected',
});

export const useNotification = () => useContext(NotificationContext);

// Simple notification sound using Web Audio API (no external file needed)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone "ding-dong" notification
    oscillator.frequency.setValueAtTime(830, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported — silent fallback
  }
}

function showBrowserNotification(order: OrderNotification) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (document.hasFocus()) return; // Only show when tab not focused

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  new Notification('🛒 Pesanan Baru!', {
    body: `${order.code} — ${order.customerName}\n${fmt(order.grandTotal)} (${order.paymentMethod})`,
    icon: '/logo-icon.svg',
    tag: `order-${order.id}`, // Prevent duplicate notifications
  });
}

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');
  const toast = useToast();
  const pathname = usePathname();
  const listenersAttached = useRef(false);

  // Track socket connection status
  useEffect(() => {
    return onSocketStatusChange(setSocketStatus);
  }, []);

  const resetPendingCount = useCallback(() => {
    setPendingCount(0);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect socket when authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (!token || pathname === '/login') {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    if (!socket || listenersAttached.current) return;

    listenersAttached.current = true;

    socket.on('order:new', (data: OrderNotification) => {
      // Update state
      setPendingCount(prev => prev + 1);
      setNotifications(prev => [data, ...prev].slice(0, 20)); // Keep last 20

      // Play sound
      playNotificationSound();

      // Toast
      const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
      toast.success(`Pesanan baru ${data.code} dari ${data.customerName} — ${fmt(data.grandTotal)}`);

      // Browser notification
      showBrowserNotification(data);
    });

    return () => {
      // Cleanup on unmount
      const s = getSocket();
      if (s) {
        s.off('order:new');
        listenersAttached.current = false;
      }
    };
  }, [pathname, toast]);

  return (
    <NotificationContext.Provider value={{ pendingCount, resetPendingCount, notifications, socketStatus }}>
      {children}
    </NotificationContext.Provider>
  );
}
