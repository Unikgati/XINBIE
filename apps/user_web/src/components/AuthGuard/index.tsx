'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/otp', '/reset-password'];
const PUBLIC_PAGES = ['/', '/product']; // pages accessible without login

/**
 * Auth guard component. Wrap around children in layout.
 * - Redirects unauthenticated users away from protected pages.
 * - Redirects authenticated users away from auth pages (login/register).
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const authed = isAuthenticated();
    const isAuthPage = AUTH_PAGES.includes(pathname);
    const isPublicPage = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith('/product/'));

    if (authed && isAuthPage) {
      // Already logged in → no need to see login/register
      router.replace('/');
    }

    if (!authed && !isAuthPage && !isPublicPage) {
      // Not logged in and trying to access protected page → redirect to login
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, isAuthenticated, router]);

  return <>{children}</>;
}
