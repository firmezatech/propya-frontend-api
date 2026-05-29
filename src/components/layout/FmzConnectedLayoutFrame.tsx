'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { FmzConnectedHeader } from './FmzConnectedHeader';
import { FmzConnectedFooter } from './FmzConnectedFooter';
import { FmzAuthenticatedRoute } from './FmzAuthenticatedRoute';
import { FmzAdminLayout } from './FmzAdminLayout';
import { FmzFullPageLoading } from './FmzFullPageLoading';
import { getCurrentAccessControlPrincipal } from '../../features/access-control/services';
import type { FmzAccessControlPrincipal } from '../../features/access-control/domain';
import { FMZ_AUTH_SESSION_CHANGED_EVENT } from '../../services/auth/auth-storage';
import { hasAdminAccessiblePage } from '../../features/access-control/domain';
import { FmzRouteAccessGuard } from '../../features/access-control/components/FmzRouteAccessGuard';
import { fmzCn } from '../../lib/fmz-classnames';

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
 * Role-isolation invariants (NON-NEGOTIABLE):
 *
 *   1. While `isAccessLoading` is true, the shared full-page loading screen is shown.
 *      Neither the tenant header nor any admin control is rendered.
 *      This is true on initial mount AND on session-change re-loads.
 *
 *   2. Once resolved:
 *        • Admin users  → `FmzAdminLayout` (owns its own header + sidebar).
 *                         This frame renders NO header for admin users.
 *        • Tenant users → `FmzConnectedHeader` (tenant-only header).
 *
 *   3. Tenant users never see admin UI.
 *      Admin users never see the tenant header, not even briefly.
 *
 *   4. Tenant notification hooks are mounted only inside the tenant layout.
 *      Admin notification hooks are mounted only inside the admin layout.
 *      No cross-role API calls are made.
 *
 * Loading shell:
 *   `FmzFullPageLoading` owns the whole viewport and uses the branded loading
 *   experience shared by login redirects and connected pages.
 */
export function FmzConnectedLayoutFrame({ children }: FmzConnectedLayoutFrameProps) {
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

  // ── Logout page — minimal wrapper, no header ────────────────────────────────
  if (isLogoutPage) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
        {children}
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  //
  // Show the unified full-page loading experience used across the app.
  // `FmzAuthenticatedRoute` performs a synchronous session check. If unauthenticated,
  // it renders null and redirects.
  //
  if (isAccessLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
        <FmzAuthenticatedRoute>
          <FmzFullPageLoading
            label="Sincronizando o seu painel, token a token."
            description="Estamos carregando sua sessão, permissões, páginas liberadas e menu lateral antes de abrir a área logada."
          />
        </FmzAuthenticatedRoute>
      </div>
    );
  }

  // ── Admin layout — fully self-contained ────────────────────────────────────
  //
  // `FmzAdminLayout` manages its own h-[100dvh], header, sidebar and content.
  // This frame renders NO header or footer for admin users.
  // Admin notification hooks are mounted exclusively inside `FmzAdminLayout`.
  //
  if (shouldRenderAdminLayout) {
    return (
      <div className={fmzCn('bg-[#F7F8FA] text-fmz-text-primary')}>
        <FmzAuthenticatedRoute>
          <FmzRouteAccessGuard principal={currentPrincipal} isLoading={false}>
            <FmzAdminLayout initialPrincipal={currentPrincipal}>{children}</FmzAdminLayout>
          </FmzRouteAccessGuard>
        </FmzAuthenticatedRoute>
      </div>
    );
  }

  // ── Tenant layout ──────────────────────────────────────────────────────────
  //
  // Tenant notification hooks are mounted exclusively inside `FmzConnectedDropdown`
  // which is rendered only by `FmzConnectedHeader` — never in the admin or loading branches.
  //
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
      <FmzAuthenticatedRoute>
        <FmzConnectedHeader principal={currentPrincipal} />
        <FmzRouteAccessGuard principal={currentPrincipal} isLoading={false}>
          <div className="flex flex-1 flex-col">{children}</div>
        </FmzRouteAccessGuard>
        <FmzConnectedFooter />
      </FmzAuthenticatedRoute>
    </div>
  );
}
