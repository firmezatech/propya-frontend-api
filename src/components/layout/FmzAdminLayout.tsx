'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { fmzAdminNavigationConfig, fmzAdminNavigationPaths, fmzAdminPageIconByKey, type FmzAdminNavigationItem } from '../../config/fmz-admin-navigation-config';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { getCurrentAccessControlPrincipal } from '../../features/access-control/services';
import { FMZ_AUTH_SESSION_CHANGED_EVENT } from '../../services/auth/auth-storage';
import { performFirmezaLogout } from '../../services/auth/fmz-logout';
import { buildFmzConnectedUserInitials, buildFmzConnectedUserSummary } from './connected-user/fmz-connected-user-storage';
import type { FmzAccessControlPage, FmzAccessControlPrincipal } from '../../features/access-control/domain';
import type { FmzConnectedUserSummary } from './connected-user/fmz-connected-user.types';
import { FmzAdminSidebar } from './FmzAdminSidebar';
import { FmzAdminContentShell } from './FmzAdminContentShell';

export type FmzAdminLayoutProps = {
  children: ReactNode;
  initialPrincipal?: FmzAccessControlPrincipal | null;
};

export const isFmzAdminConnectedPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return fmzAdminNavigationPaths.some((path) => pathname.endsWith(path) || pathname.includes(`${path}/`));
};

const buildDefaultUserSummary = (): FmzConnectedUserSummary => ({
  name: fmzPublicLayoutConfig.defaultConnectedUserName,
  email: fmzPublicLayoutConfig.defaultConnectedUserEmail,
  initials: 'FT',
});

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const isAdminPage = (page: FmzAccessControlPage): boolean => normalizeKey(page.key).startsWith('admin.');

const buildAdminNavigationItemFromPage = (page: FmzAccessControlPage): FmzAdminNavigationItem => {
  const pageKey = normalizeKey(page.key);
  const Icon = fmzAdminPageIconByKey[pageKey] ?? fmzAdminPageIconByKey['admin.dashboard'];

  return {
    id: pageKey,
    pageKey,
    label: page.label || page.name || pageKey,
    href: page.path,
    requiredPermissionKey: normalizeKey(page.requiredPermission ?? ''),
    icon: Icon,
  };
};

const buildAdminNavigationItems = (principal: FmzAccessControlPrincipal | null): FmzAdminNavigationItem[] => {
  if (!principal) return [];

  const uniquePagesByKey = new Map<string, FmzAccessControlPage>();
  principal.accessiblePages
    .filter(isAdminPage)
    .sort((left, right) => left.order - right.order)
    .forEach((page) => {
      if (!uniquePagesByKey.has(page.key)) uniquePagesByKey.set(page.key, page);
    });

  return Array.from(uniquePagesByKey.values()).map(buildAdminNavigationItemFromPage);
};

export function FmzAdminLayout({ children, initialPrincipal = null }: FmzAdminLayoutProps) {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FmzConnectedUserSummary>(buildDefaultUserSummary);
  const [currentPrincipal, setCurrentPrincipal] = useState<FmzAccessControlPrincipal | null>(initialPrincipal);

  const syncUserSummary = useCallback(() => setCurrentUser(buildFmzConnectedUserSummary()), []);

  useEffect(() => {
    if (!initialPrincipal) return;
    setCurrentPrincipal(initialPrincipal);
    if (initialPrincipal.name || initialPrincipal.email) {
      setCurrentUser((previous) => {
        const nextName = initialPrincipal.name || previous.name;
        return {
          name: nextName,
          email: initialPrincipal.email || previous.email,
          initials: buildFmzConnectedUserInitials(nextName),
        };
      });
    }
  }, [initialPrincipal]);

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
    if (initialPrincipal) return undefined;

    let isMounted = true;
    async function loadCurrentAccess() {
      try {
        const principal = await getCurrentAccessControlPrincipal();
        if (!isMounted) return;
        setCurrentPrincipal(principal);
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
        if (isMounted) setCurrentPrincipal(null);
      }
    }
    void loadCurrentAccess();
    return () => { isMounted = false; };
  }, [initialPrincipal]);

  const handleLogout = useCallback(() => {
    performFirmezaLogout({ router, locale: params?.locale });
  }, [params?.locale, router]);

  const navigationItems = useMemo(() => buildAdminNavigationItems(currentPrincipal), [currentPrincipal]);
  const effectivePermissionKeys = useMemo(
    () => new Set((currentPrincipal?.permissionKeys ?? []).map((permissionKey) => normalizeKey(permissionKey))),
    [currentPrincipal?.permissionKeys],
  );

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-0 flex-1 overflow-hidden bg-[#F7F8FA] lg:flex-row">
      <FmzAdminSidebar
        locale={params?.locale}
        pathname={pathname}
        currentUser={currentUser}
        effectivePermissionKeys={effectivePermissionKeys}
        navigationItems={navigationItems}
        onLogout={handleLogout}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F8FA]">
        <FmzAdminContentShell>{children}</FmzAdminContentShell>
      </div>
    </div>
  );
}
