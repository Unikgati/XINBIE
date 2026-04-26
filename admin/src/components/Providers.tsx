'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import NotificationProvider from '@/components/NotificationProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <NotificationProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}
