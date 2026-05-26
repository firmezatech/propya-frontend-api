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
 * Role-isolation invariants (NON-NEGOTIABLE):
 *
 *   1. While `isAccessLoading` is true, a neutral skeleton header is shown.
 *      Neither the tenant header nor any admin control is rendered.
 *      This is true on initial mount AND on session-change re-loads.
 *
 *   2. Once resolved:
 *        • Admin users  → `FmzAdminLayout` (owns its own header + sidebar).
 *                         This frame renders NO header for admin users.
 *        • Tenant users → `HeaderConn` (tenant-only header).
 *
 *   3. Tenant users never see admin UI.
 *      Admin users never see the tenant header, not even briefly.
 *
 *   4. Tenant notification hooks are mounted only inside the tenant layout.
 *      Admin notification hooks are mounted only inside the admin layout.
 *      No cross-role API calls are made.
 *
 * Loading shell:
 *   `FmzNeutralLoadingHeader` (72 px skeleton) + `FmzFullPageLoading` (flex-1,
 *   fills remaining viewport). The full-page loader does NOT use `min-h-[100dvh]`
 *   in this context to avoid overflowing behind the header.
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
  // Show a role-neutral skeleton: sticky header skeleton + centered spinner.
  //
  // Invariants enforced here:
  //   - `FmzNeutralLoadingHeader` contains NO tenant-specific UI.
  //   - `FmzNeutralLoadingHeader` contains NO admin-specific UI.
  //   - `FmzFullPageLoading` fills the remaining viewport height (`flex-1
  //     min-h-0`) so that header + loader = exactly 100dvh, no overflow.
  //   - `AuthenticatedRoute` performs a synchronous session check (no loading
  //     flash of its own). If unauthenticated, it renders null and redirects.
  //
  if (isAccessLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
        <AuthenticatedRoute>
          <FmzNeutralLoadingHeader />
          <FmzFullPageLoading
            label="Preparando sua área logada..."
            description="Estamos carregando permissões, páginas liberadas e menu lateral antes de exibir o dashboard."
            className="flex-1 min-h-0"
          />
        </AuthenticatedRoute>
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
        <AuthenticatedRoute>
          <FmzRouteAccessGuard principal={currentPrincipal} isLoading={false}>
            <FmzAdminLayout initialPrincipal={currentPrincipal}>{children}</FmzAdminLayout>
          </FmzRouteAccessGuard>
        </AuthenticatedRoute>
      </div>
    );
  }

  // ── Tenant layout ──────────────────────────────────────────────────────────
  //
  // Tenant notification hooks are mounted exclusively inside `FmzConnectedDropdown`
  // which is rendered only by `HeaderConn` — never in the admin or loading branches.
  //
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F8FA] text-fmz-text-primary">
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
