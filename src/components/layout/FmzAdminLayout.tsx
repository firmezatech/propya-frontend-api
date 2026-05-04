'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { fmzAdminNavigationConfig, fmzAdminNavigationPaths } from '../../config/fmz-admin-navigation-config';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { getAccessControlCatalog, getCurrentAccessControlPrincipal } from '../../features/access-control/services';
import { clearFirmezaSession, FMZ_AUTH_SESSION_CHANGED_EVENT } from '../../services/auth/auth-storage';
import { buildFmzConnectedUserInitials, buildFmzConnectedUserSummary } from './connected-user/fmz-connected-user-storage';
import type { FmzAccessControlCatalog } from '../../features/access-control/domain';
import type { FmzConnectedUserSummary } from './connected-user/fmz-connected-user.types';
import { FmzAdminSidebar } from './FmzAdminSidebar';

export type FmzAdminLayoutProps = {
  children: ReactNode;
};

const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${href}`;

export const isFmzAdminConnectedPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return fmzAdminNavigationPaths.some((path) => pathname.endsWith(path) || pathname.includes(`${path}/`));
};

const buildDefaultUserSummary = (): FmzConnectedUserSummary => ({
  name: fmzPublicLayoutConfig.defaultConnectedUserName,
  email: fmzPublicLayoutConfig.defaultConnectedUserEmail,
  initials: 'FT',
});

export function FmzAdminLayout({ children }: FmzAdminLayoutProps) {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FmzConnectedUserSummary>(buildDefaultUserSummary);
  const [effectivePermissionKeys, setEffectivePermissionKeys] = useState<Set<string>>(new Set());
  const [catalog, setCatalog] = useState<FmzAccessControlCatalog>({ pages: [], permissions: [] });

  const syncUserSummary = useCallback(() => setCurrentUser(buildFmzConnectedUserSummary()), []);

  useEffect(() => {
    syncUserSummary();
    window.addEventListener('storage', syncUserSummary);
    window.addEventListener('walletChanged', syncUserSummary);
    window.addEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, syncUserSummary);
    return () => {
      window.removeEventListener('storage', syncUserSummary);
      window.removeEventListener('walletChanged', syncUserSummary);
      window.removeEventListener(FMZ_AUTH_SESSION_CHANGED_EVENT, syncUserSummary);
    };
  }, [syncUserSummary]);

  useEffect(() => {
    let isMounted = true;
    async function loadCurrentAccess() {
      try {
        const [principal, nextCatalog] = await Promise.all([getCurrentAccessControlPrincipal(), getAccessControlCatalog()]);
        if (!isMounted) return;
        setCatalog(nextCatalog);
        setEffectivePermissionKeys(new Set(principal.permissionKeys));
        if (principal.name || principal.email) {
          setCurrentUser((previous) => {
            const nextName = principal.name || previous.name;
            return {
              name: nextName,
              email: principal.email || previous.email,
              initials: buildFmzConnectedUserInitials(nextName),
            };
          });
        }
      } catch {
        if (isMounted) setEffectivePermissionKeys(new Set());
      }
    }
    void loadCurrentAccess();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = useCallback(() => {
    clearFirmezaSession();
    router.push(buildFmzLocalizedHref(params?.locale, fmzPublicLayoutConfig.connectedLogoutPath));
  }, [params?.locale, router]);

  const navigationItems = useMemo(() => {
    const pageByKey = new Map(catalog.pages.map((page) => [page.key, page]));
    const permissionByKey = new Map(catalog.permissions.map((permission) => [permission.key, permission]));

    return fmzAdminNavigationConfig.items.flatMap((item) => {
      const permission = permissionByKey.get(item.requiredPermissionKey);
      if (!permission) return [];

      const linkedPages = permission.pageKeys.map((pageKey) => pageByKey.get(pageKey)).filter(Boolean);
      const navigationPage = linkedPages.find((page) => page?.path === item.href) ?? linkedPages[0];
      if (!navigationPage) return [];

      return [{
        ...item,
        label: navigationPage.label || navigationPage.name || item.label,
        href: navigationPage.path || item.href,
      }];
    });
  }, [catalog.pages, catalog.permissions]);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <FmzAdminSidebar
        locale={params?.locale}
        pathname={pathname}
        currentUser={currentUser}
        effectivePermissionKeys={effectivePermissionKeys}
        navigationItems={navigationItems}
        onLogout={handleLogout}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
