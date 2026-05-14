'use client';

import { ReactNode } from 'react';
import DgSnackbar from '@/components/DgSnackbar';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DgSnackbar />
    </>
  );
}
