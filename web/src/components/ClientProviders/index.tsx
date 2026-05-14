'use client';

import { ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard/index';
import HydrationZustand from '@/components/HydrationZustand';
import DgSnackbar from '@/components/DgSnackbar';
import NotificationInitializer from '@/components/NotificationInitializer';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <HydrationZustand>
      <AuthGuard>
        <NotificationInitializer />
        {children}
        <DgSnackbar />
      </AuthGuard>
    </HydrationZustand>
  );
}
