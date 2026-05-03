'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FMZ_AUTH_SESSION_CHANGED_EVENT, hasFirmezaSession } from '../../../../services/auth/auth-storage';

interface AuthenticatedRouteProps {
  children: ReactNode;
}

export default function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loginPath = params?.locale ? `/${params.locale}` : '/';

    const validateSession = () => {
      const hasSession = hasFirmezaSession();
      setIsAuthenticated(hasSession);
      if (!hasSession) router.replace(loginPath);
    };

    validateSession();
    window.addEventListener('storage', validateSession);
    window.addEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, validateSession);

    return () => {
      window.removeEventListener('storage', validateSession);
      window.removeEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, validateSession);
    };
  }, [params?.locale, router]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
