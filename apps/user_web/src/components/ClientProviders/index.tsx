'use client';

import AuthGuard from '@/components/AuthGuard';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
