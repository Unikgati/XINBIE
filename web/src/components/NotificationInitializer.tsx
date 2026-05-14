'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

export default function NotificationInitializer() {
  const { fetchNotifications, initSocket } = useNotificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotifications();
      initSocket();
    }
  }, [isAuthenticated, fetchNotifications, initSocket]);

  return null;
}
