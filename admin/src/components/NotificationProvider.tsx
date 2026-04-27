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
  decrementPendingCount: () => void;
  notifications: OrderNotification[];
  socketStatus: SocketStatus;
}

const NotificationContext = createContext<NotificationContextType>({
  pendingCount: 0,
  decrementPendingCount: () => {},
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/** Fetch unread count from backend */
async function fetchUnreadCount(): Promise<number> {
  const token = getAuthToken();
  if (!token) return 0;
  try {
    const res = await fetch(`${API_URL}/admin/orders/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return typeof data.unreadCount === 'number' ? data.unreadCount : 0;
  } catch {
    return 0;
  }
}

// BroadcastChannel for cross-tab sync (graceful fallback if unsupported)
const CHANNEL_NAME = 'dapurgizi_unread_sync';

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');
  const toast = useToast();
  const pathname = usePathname();
  const listenersAttached = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hasFetchedRef = useRef(false);

  // Track socket connection status
  useEffect(() => {
    return onSocketStatusChange(setSocketStatus);
  }, []);

  // ─── Fix #1: Re-fetch unread count on WebSocket reconnection ───
  // ─── Fix #4: Re-fetch on login (pathname transitions away from /login) ───
  useEffect(() => {
    const token = getAuthToken();
    if (!token || pathname === '/login') {
      hasFetchedRef.current = false; // Reset so we re-fetch after next login
      return;
    }

    // Fetch on first mount OR when socket reconnects
    if (!hasFetchedRef.current || socketStatus === 'connected') {
      hasFetchedRef.current = true;
      fetchUnreadCount().then(setPendingCount);
    }
  }, [pathname, socketStatus]);

  const decrementPendingCount = useCallback(() => {
    setPendingCount(prev => {
      const next = Math.max(0, prev - 1);
      // ─── Fix #2: Broadcast to other tabs ───
      channelRef.current?.postMessage({ type: 'sync', count: next });
      return next;
    });
  }, []);

  // ─── Fix #2: Cross-tab sync via BroadcastChannel ───
  useEffect(() => {
    const channel = getBroadcastChannel();
    if (!channel) return;
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, count } = event.data || {};
      if (type === 'sync' && typeof count === 'number') {
        setPendingCount(count);
      }
      if (type === 'refetch') {
        fetchUnreadCount().then(setPendingCount);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
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

    // Store named refs so socket.off() only removes OUR listeners, not other components'
    const handleNewOrder = (data: OrderNotification) => {
      setPendingCount(prev => {
        const next = prev + 1;
        channelRef.current?.postMessage({ type: 'sync', count: next });
        return next;
      });
      setNotifications(prev => [data, ...prev].slice(0, 20));

      playNotificationSound();

      const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
      toast.success(`Pesanan baru ${data.code} dari ${data.customerName} — ${fmt(data.grandTotal)}`);

      showBrowserNotification(data);
    };

    const handleStatusUpdate = (data: { orderId: string; code?: string; status: string; paymentStatus?: string }) => {
      if (data.paymentStatus === 'PAID') {
        playNotificationSound();
        toast.success(`Pembayaran untuk pesanan ${data.code || data.orderId.split('-')[0]} telah diterima!`);
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusUpdate);

    return () => {
      // Only remove OUR specific listeners, not all listeners for these events
      socket.off('order:new', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusUpdate);
      listenersAttached.current = false;
    };
  }, [pathname, toast]);

  return (
    <NotificationContext.Provider value={{ pendingCount, decrementPendingCount, notifications, socketStatus }}>
      {children}
    </NotificationContext.Provider>
  );
}
