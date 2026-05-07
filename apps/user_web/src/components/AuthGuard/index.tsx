'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/otp', '/reset-password'];
const PROTECTED_PAGES = ['/checkout', '/orders', '/profile', '/payment', '/cart'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const authed = isAuthenticated();
    const isAuthPage = AUTH_PAGES.includes(pathname);
    const isProtectedPage = PROTECTED_PAGES.includes(pathname) || PROTECTED_PAGES.some(p => pathname.startsWith(p + '/'));

    if (authed && isAuthPage) {
      router.replace('/');
      return;
    }

    if (!authed && isProtectedPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
  }, [pathname, isAuthenticated, router]);

  return <>{children}</>;
}
