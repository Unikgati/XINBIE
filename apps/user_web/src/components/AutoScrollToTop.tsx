'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AutoScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Force scroll to top instantly on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    
    // Fallback: If there are any scrollable containers inside, reset them too
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
