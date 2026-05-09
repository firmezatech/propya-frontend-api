'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fmzPublicLayoutConfig } from '../../../../../config/fmz-public-layout-config';
import HeaderConn from '../HeaderConn';
import FooterConn from '../FooterConn';
import AuthenticatedRoute from '../AuthenticatedRoute';
import { FmzAdminLayout } from '../../../../../components/layout/FmzAdminLayout';
import { getCurrentAccessControlPrincipal } from '../../../../../features/access-control/services';
import type { FmzAccessControlPrincipal } from '../../../../../features/access-control/domain';
import { FMZ_AUTH_SESSION_CHANGED_EVENT } from '../../../../../services/auth/auth-storage';
import { hasAdminAccessiblePage } from '../../../../../features/access-control/domain';
import { FmzRouteAccessGuard } from '../../../../../features/access-control/components/FmzRouteAccessGuard';

interface FmzConnectedLayoutFrameProps {
  children: ReactNode;
}

const isConnectedLogoutPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(fmzPublicLayoutConfig.connectedLogoutPath);
};

export default function FmzConnectedLayoutFrame({ children }: FmzConnectedLayoutFrameProps) {
  const pathname = usePathname();
  const [currentPrincipal, setCurrentPrincipal] = useState<FmzAccessControlPrincipal | null>(null);
  const [isAccessLoading, setIsAccessLoading] = useState(true);
  const isLogoutPage = isConnectedLogoutPath(pathname);

  const loadCurrentPrincipal = useCallback(async () => {
    setIsAccessLoading(true);
    try {
      const principal = await getCurrentAccessControlPrincipal();
      setCurrentPrincipal(principal);
    } catch {
      setCurrentPrincipal(null);
    } finally {
      setIsAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentPrincipal();
    window.addEventListener('storage', loadCurrentPrincipal);
    window.addEventListener('walletChanged', loadCurrentPrincipal);
    window.addEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, loadCurrentPrincipal);
    return () => {
      window.removeEventListener('storage', loadCurrentPrincipal);
      window.removeEventListener('walletChanged', loadCurrentPrincipal);
      window.removeEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, loadCurrentPrincipal);
    };
  }, [loadCurrentPrincipal]);

  const shouldRenderAdminLayout = useMemo(() => {
    if (isLogoutPage) return false;
    return hasAdminAccessiblePage(currentPrincipal);
  }, [currentPrincipal, isLogoutPage]);

  if (isLogoutPage) {
    return <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">{children}</div>;
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
      <AuthenticatedRoute>
        <HeaderConn />
        <FmzRouteAccessGuard principal={currentPrincipal} isLoading={isAccessLoading}>
          {shouldRenderAdminLayout ? (
            <FmzAdminLayout>{children}</FmzAdminLayout>
          ) : (
            <div className="flex flex-1 flex-col">{children}</div>
          )}
        </FmzRouteAccessGuard>
        <FooterConn />
      </AuthenticatedRoute>
    </div>
  );
}
