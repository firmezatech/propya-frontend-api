'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  fmzAdminNavigationConfig,
  fmzAdminNavigationPaths,
  fmzAdminPageIconByKey,
  type FmzAdminNavigationItem,
} from '../../config/fmz-admin-navigation-config';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { getCurrentAccessControlPrincipal } from '../../features/access-control/services';
import { FMZ_AUTH_SESSION_CHANGED_EVENT } from '../../services/auth/auth-storage';
import { performFirmezaLogout } from '../../services/auth/fmz-logout';
import {
  buildFmzConnectedUserInitials,
  buildFmzConnectedUserSummary,
} from './connected-user/fmz-connected-user-storage';
import type {
  FmzAccessControlPage,
  FmzAccessControlPrincipal,
} from '../../features/access-control/domain';
import type { FmzConnectedUserSummary } from './connected-user/fmz-connected-user.types';
import { FmzAdminSidebar } from './FmzAdminSidebar';
import { FmzAdminContentShell } from './FmzAdminContentShell';
import { FmzAdminHeader } from './FmzAdminHeader';
import { useFmzAdminNotifications } from '../../features/admin-notifications/hooks/fmz-admin-notifications';

export type FmzAdminLayoutProps = {
  children: ReactNode;
  initialPrincipal?: FmzAccessControlPrincipal | null;
};

export const isFmzAdminConnectedPath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return fmzAdminNavigationPaths.some(
    (path) => pathname.endsWith(path) || pathname.includes(`${path}/`),
  );
};

// Default initials shown before the real user data loads.
// "FT" = Firmeza Tenant — a safe placeholder that matches the avatar size.
const DEFAULT_USER_INITIALS = 'FT';

const buildDefaultUserSummary = (): FmzConnectedUserSummary => ({
  name: fmzPublicLayoutConfig.defaultConnectedUserName,
  email: fmzPublicLayoutConfig.defaultConnectedUserEmail,
  initials: DEFAULT_USER_INITIALS,
});

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const isAdminPage = (page: FmzAccessControlPage): boolean =>
  normalizeKey(page.key).startsWith('admin.');

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

/**
 * Builds the ordered, deduplicated admin navigation item list from a principal.
 *
 * Deduplication runs first (O(n)), then sort (O(k log k) where k ≤ n).
 * Sorting after dedup avoids ordering duplicate entries that will be discarded.
 */
const buildAdminNavigationItems = (
  principal: FmzAccessControlPrincipal | null,
): FmzAdminNavigationItem[] => {
  if (!principal) return [];

  // 1. Deduplicate by key — first occurrence wins.
  const uniquePagesByKey = new Map<string, FmzAccessControlPage>();
  principal.accessiblePages
    .filter(isAdminPage)
    .forEach((page) => {
      if (!uniquePagesByKey.has(page.key)) uniquePagesByKey.set(page.key, page);
    });

  // 2. Sort the already-deduplicated set.
  return Array.from(uniquePagesByKey.values())
    .sort((left, right) => left.order - right.order)
    .map(buildAdminNavigationItemFromPage);
};

/**
 * Applies a principal's identity fields to the user-summary state.
 * Called from two separate effects (initialPrincipal prop + async fallback load)
 * — extracted here to avoid duplicating the same setState logic.
 */
function applyPrincipalToUserState(
  principal: FmzAccessControlPrincipal,
  setCurrentUser: Dispatch<SetStateAction<FmzConnectedUserSummary>>,
): void {
  if (!principal.name && !principal.email) return;
  setCurrentUser((previous) => {
    const nextName = principal.name || previous.name;
    return {
      name: nextName,
      email: principal.email || previous.email,
      initials: buildFmzConnectedUserInitials(nextName),
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fully self-contained admin layout.
 *
 * Renders its own sticky header (with notification bell) and sidebar.
 * Manages its own viewport height (`h-[100dvh]`) so the frame above it
 * does not need to know about admin-specific overflow strategy.
 *
 * Data flow:
 *   useFmzAdminNotifications() → FmzAdminHeader → FmzAdminNotificationBell
 *   principal            → FmzAdminSidebar (navigation items + permissions)
 */
export function FmzAdminLayout({ children, initialPrincipal = null }: FmzAdminLayoutProps) {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<FmzConnectedUserSummary>(buildDefaultUserSummary);
  const [currentPrincipal, setCurrentPrincipal] =
    useState<FmzAccessControlPrincipal | null>(initialPrincipal);

  const syncUserSummary = useCallback(
    () => setCurrentUser(buildFmzConnectedUserSummary()),
    [],
  );

  // Sync user summary from initialPrincipal when it arrives.
  useEffect(() => {
    if (!initialPrincipal) return;
    setCurrentPrincipal(initialPrincipal);
    applyPrincipalToUserState(initialPrincipal, setCurrentUser);
  }, [initialPrincipal]);

  // Sync user summary from storage events (wallet change, session change).
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

  // Fallback principal load when no initialPrincipal is provided.
  useEffect(() => {
    if (initialPrincipal) return undefined;

    let isMounted = true;
    const loadCurrentAccess = async () => {
      try {
        const principal = await getCurrentAccessControlPrincipal();
        if (!isMounted) return;
        setCurrentPrincipal(principal);
        applyPrincipalToUserState(principal, setCurrentUser);
      } catch {
        if (isMounted) setCurrentPrincipal(null);
      }
    };
    void loadCurrentAccess();
    return () => { isMounted = false; };
  }, [initialPrincipal]);

  const handleLogout = useCallback(() => {
    performFirmezaLogout({ router, locale: params?.locale });
  }, [params?.locale, router]);

  const navigationItems = useMemo(
    () => buildAdminNavigationItems(currentPrincipal),
    [currentPrincipal],
  );

  const effectivePermissionKeys = useMemo(
    () =>
      new Set(
        (currentPrincipal?.permissionKeys ?? []).map((key) => normalizeKey(key)),
      ),
    [currentPrincipal?.permissionKeys],
  );

  // Admin notifications — only admin endpoints are called here.
  const {
    unreadCount: notificationUnreadCount,
    notificationsState,
    fetchNotifications,
    handleMarkAsRead: handleNotificationMarkAsRead,
    handleMarkAllAsRead: handleNotificationMarkAllAsRead,
  } = useFmzAdminNotifications();

  return (
    // The admin layout owns its own full-viewport height and overflow strategy.
    // No ancestor needs to set h-[100dvh]; this component is self-contained.
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F7F8FA]">

      {/* Admin header — notification bell lives here, not in the sidebar */}
      <FmzAdminHeader
        locale={params?.locale}
        unreadCount={notificationUnreadCount}
        notificationsState={notificationsState}
        onFetchNotifications={fetchNotifications}
        onMarkNotificationAsRead={handleNotificationMarkAsRead}
        onMarkAllNotificationsAsRead={handleNotificationMarkAllAsRead}
      />

      {/* Sidebar + scrollable content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FmzAdminSidebar
          locale={params?.locale}
          pathname={pathname}
          effectivePermissionKeys={effectivePermissionKeys}
          navigationItems={navigationItems}
          onLogout={handleLogout}
        />
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F8FA]">
          <FmzAdminContentShell>{children}</FmzAdminContentShell>
        </div>
      </div>
    </div>
  );
}
