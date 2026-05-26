'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fmzPublicLayoutConfig } from '../../../../../config/fmz-public-layout-config';
import HeaderConn from '../HeaderConn';
import FooterConn from '../FooterConn';
import AuthenticatedRoute from '../AuthenticatedRoute';
import { FmzAdminLayout } from '../../../../../components/layout/FmzAdminLayout';
import { FmzFullPageLoading } from '../../../../../components/layout/FmzFullPageLoading';
import { FmzNeutralLoadingHeader } from '../../../../../components/layout/FmzNeutralLoadingHeader';
import { getCurrentAccessControlPrincipal } from '../../../../../features/access-control/services';
import type { FmzAccessControlPrincipal } from '../../../../../features/access-control/domain';
import { FMZ_AUTH_SESSION_CHANGED_EVENT } from '../../../../../services/auth/auth-storage';
import { hasAdminAccessiblePage } from '../../../../../features/access-control/domain';
import { FmzRouteAccessGuard } from '../../../../../features/access-control/components/FmzRouteAccessGuard';
import { fmzCn } from '../../../../../lib/fmz-classnames';

interface FmzConnectedLayoutFrameProps {
  children: ReactNode;
}

const isConnectedLogoutPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(fmzPublicLayoutConfig.connectedLogoutPath);
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Top-level frame for all authenticated pages.
 *
 * Role-isolation invariants:
 *   - While `isAccessLoading` is true, a neutral skeleton header is shown.
 *     Neither the tenant header nor any admin control is rendered.
 *   - Once resolved:
 *       • Admin users: `FmzAdminLayout` renders its own header + sidebar.
 *         `FmzConnectedLayoutFrame` renders NO header for admin users.
 *       • Tenant users: `HeaderConn` (tenant header) is rendered.
 *   - Tenant users never see admin UI; admin users never see tenant header.
 */
export default function FmzConnectedLayoutFrame({ children }: FmzConnectedLayoutFrameProps) {
  const pathname = usePathname();
  const [currentPrincipal, setCurrentPrincipal] =
    useState<FmzAccessControlPrincipal | null>(null);
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

  // ── Logout page — minimal wrapper, no header ──────────────────────────────
  if (isLogoutPage) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
        {children}
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  // Show a neutral skeleton header — no role-specific controls.
  // FmzFullPageLoading covers the content area so users see a complete loading
  // shell without any tenant or admin elements flickering.
  if (isAccessLoading) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
        <AuthenticatedRoute>
          <FmzNeutralLoadingHeader />
          <FmzFullPageLoading
            label="Preparando sua área logada..."
            description="Estamos carregando permissões, páginas liberadas e menu lateral antes de exibir o dashboard."
          />
        </AuthenticatedRoute>
      </div>
    );
  }

  // ── Admin layout — fully self-contained ───────────────────────────────────
  // FmzAdminLayout manages its own h-[100dvh], header, sidebar and content.
  // This frame renders NO header for admin users.
  if (shouldRenderAdminLayout) {
    return (
      <div className={fmzCn('bg-[#F7F8FA] text-fmz-text-primary')}>
        <AuthenticatedRoute>
          <FmzRouteAccessGuard principal={currentPrincipal} isLoading={false}>
            <FmzAdminLayout initialPrincipal={currentPrincipal}>{children}</FmzAdminLayout>
          </FmzRouteAccessGuard>
        </AuthenticatedRoute>
      </div>
    );
  }

  // ── Tenant layout ─────────────────────────────────────────────────────────
  // Full tenant header + content + footer.
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
      <AuthenticatedRoute>
        <HeaderConn principal={currentPrincipal} />
        <FmzRouteAccessGuard principal={currentPrincipal} isLoading={false}>
          <div className="flex flex-1 flex-col">{children}</div>
        </FmzRouteAccessGuard>
        <FooterConn />
      </AuthenticatedRoute>
    </div>
  );
}
