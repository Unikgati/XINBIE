'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { getAuthToken } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = getAuthToken();
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else if (token && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  // Prevent hydration mismatch by not rendering layout elements until mounted
  if (!isMounted) return null;

  const isLogin = pathname === '/login';

  if (isLogin) {
    return <main>{children}</main>;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
