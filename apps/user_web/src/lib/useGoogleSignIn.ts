'use client';

import { useEffect, useRef, useCallback } from 'react';

const GOOGLE_CLIENT_ID = '341228818159-oplu8ar5pb9q0p7o9gqf88jlkvvdf5fk.apps.googleusercontent.com';

interface GoogleUser {
  idToken: string;
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

function decodeJwtPayload(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Renders Google's official sign-in button into a container ref.
 * No popup issues, no redirect_uri needed, 100% reliable.
 * 
 * Usage:
 *   const { googleButtonRef } = useGoogleSignIn((user) => { ... });
 *   return <div ref={googleButtonRef} />;
 */
export function useGoogleSignIn(
  onSuccess: (user: GoogleUser) => void | Promise<void>,
  onError?: (error: string) => void
) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  const initializedRef = useRef(false);
  callbackRef.current = onSuccess;
  errorRef.current = onError;

  const initGoogle = useCallback(() => {
    const google = (window as any).google;
    if (!google?.accounts?.id || !googleButtonRef.current || initializedRef.current) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        try {
          const payload = decodeJwtPayload(response.credential);
          callbackRef.current({
            idToken: response.credential,
            email: payload.email,
            name: payload.name || payload.email,
            picture: payload.picture,
            sub: payload.sub,
          });
        } catch {
          errorRef.current?.('Gagal memproses respons Google.');
        }
      },
      auto_select: false,
      use_fedcm_for_prompt: false,
    });

    google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: googleButtonRef.current.offsetWidth || 300,
    });

    initializedRef.current = true;
  }, []);

  useEffect(() => {
    // Load GIS script
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      // Script already loaded, initialize immediately
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Small delay to ensure google object is ready
      setTimeout(initGoogle, 100);
    };
    document.head.appendChild(script);
  }, [initGoogle]);

  // Re-initialize when ref is attached (for component re-renders)
  useEffect(() => {
    if (googleButtonRef.current && !initializedRef.current) {
      const timer = setTimeout(initGoogle, 200);
      return () => clearTimeout(timer);
    }
  }, [initGoogle]);

  return { googleButtonRef };
}
