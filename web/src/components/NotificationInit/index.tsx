'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

export default function NotificationInit() {
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const initSocket = useNotificationStore((s) => s.initSocket);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotifications();
      initSocket();

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated, fetchNotifications, initSocket]);

  return null;
}
