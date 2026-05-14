'use client';

import { ReactNode, useEffect, useState } from 'react';

/**
 * HydrationZustand prevents hydration mismatch when using persisted stores.
 * It ensures children are only rendered once the client-side store is hydrated.
 */
export default function HydrationZustand({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // Or a loading skeleton
  }

  return <>{children}</>;
}
