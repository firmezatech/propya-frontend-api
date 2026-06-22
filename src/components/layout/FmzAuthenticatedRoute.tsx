'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { FMZ_AUTH_SESSION_CHANGED_EVENT, hasFirmezaSession } from '../../services/auth/auth-storage';

interface FmzAuthenticatedRouteProps {
  children: ReactNode;
}

// Strips the `/<locale>` prefix so the result matches the locale-less path the
// login form expects in its `returnTo` param (see FmzAuthAccessCard).
function stripLocalePrefix(pathname: string, locale: string | undefined): string {
  if (!locale) return pathname;
  const prefix = `/${locale}`;
  return pathname === prefix ? '/' : pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}

/**
 * Guards authenticated pages.
 *
 * Auth check is SYNCHRONOUS — `hasFirmezaSession()` reads localStorage immediately.
 * There is no loading state: on the very first render we already know whether
 * the session exists, so we never render an intermediate loading spinner.
 *
 * Redirect to login fires in useEffect if the session is absent. The tiny gap
 * between the synchronous `null` render and the router.replace call is
 * imperceptible (sub-frame) and shows nothing, which is better than showing
 * a loading spinner that may confuse the user.
 *
 * Storage and custom session events are listened to so that cross-tab logout
 * and programmatic session invalidation are handled correctly.
 */
export function FmzAuthenticatedRoute({ children }: FmzAuthenticatedRouteProps) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();

  // Synchronous init — no useEffect needed to determine the initial state.
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasFirmezaSession());

  useEffect(() => {
    const loginPath = params?.locale ? `/${params.locale}` : '/';
    // Preserves the page the user was trying to reach (e.g. a deep link from an email)
    // so the login form can send them back here instead of the default dashboard.
    const returnTo = stripLocalePrefix(pathname, params?.locale);
    const loginPathWithReturnTo = `${loginPath}?returnTo=${encodeURIComponent(returnTo)}`;

    // If the synchronous check already returned false, redirect now.
    if (!hasFirmezaSession()) {
      setIsAuthenticated(false);
      router.replace(loginPathWithReturnTo);
      return;
    }

    // React to session changes from other tabs or programmatic logout/login.
    const revalidateSession = () => {
      const hasSession = hasFirmezaSession();
      setIsAuthenticated(hasSession);
      if (!hasSession) router.replace(loginPathWithReturnTo);
    };

    window.addEventListener('storage', revalidateSession);
    window.addEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, revalidateSession);

    return () => {
      window.removeEventListener('storage', revalidateSession);
      window.removeEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, revalidateSession);
    };
  }, [params?.locale, pathname, router]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
