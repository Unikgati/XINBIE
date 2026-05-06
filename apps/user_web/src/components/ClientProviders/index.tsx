'use client';

import { ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard/index';
import HydrationZustand from '@/components/HydrationZustand';
import DgSnackbar from '@/components/DgSnackbar';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <HydrationZustand>
      <AuthGuard>
        {children}
        <DgSnackbar />
      </AuthGuard>
    </HydrationZustand>
  );
}
