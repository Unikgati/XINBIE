import { create } from 'zustand';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  initSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await api.get<any>('/notifications?limit=50');
      set({ 
        notifications: res.data, 
        unreadCount: res.unreadCount,
        loading: false 
      });
    } catch (error) {
      console.error('[NotificationStore] Fetch failed:', error);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('[NotificationStore] Mark read failed:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all', {});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('[NotificationStore] Mark all read failed:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
    
    // Optional: browser notification
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
      });
    }
  },

  initSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    // Remove old listeners to avoid duplicates
    socket.off('notification:new');

    socket.on('notification:new', (notification: Notification) => {
      get().addNotification(notification);
    });
  },
}));
