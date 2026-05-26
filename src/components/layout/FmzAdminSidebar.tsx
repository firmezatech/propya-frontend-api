'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { FmzAdminNavigationItem } from '../../config/fmz-admin-navigation-config';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { fmzAdminSidebarLayoutConfig } from '../../config/fmz-admin-sidebar-layout-config';
import { buildFmzLocalizedHref } from '../../lib/fmz-localize-href';
import { fmzCn } from '../../lib/fmz-classnames';

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzAdminSidebarProps = {
  locale?: string;
  pathname: string | null;
  effectivePermissionKeys: Set<string>;
  navigationItems: readonly FmzAdminNavigationItem[];
  onLogout: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isAdminSidebarItemActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(href) || pathname.includes(`${href}/`);
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Admin sidebar — navigation items and logout only.
 * The notification bell has been moved to `FmzAdminHeader` so that it
 * matches the tenant header's UX pattern and lives in the header bar.
 */
export function FmzAdminSidebar({
  locale,
  pathname,
  effectivePermissionKeys,
  navigationItems,
  onLogout,
}: FmzAdminSidebarProps) {
  const visibleItems = navigationItems.filter(
    (item) =>
      !item.requiredPermissionKey ||
      effectivePermissionKeys.has(item.requiredPermissionKey.toLowerCase()),
  );

  return (
    <aside className={fmzAdminSidebarLayoutConfig.sidebar}>
      <div className={fmzAdminSidebarLayoutConfig.navigationArea}>
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <FmzAdminSidebarLink
              key={item.id}
              item={item}
              locale={locale}
              pathname={pathname}
            />
          ))
        ) : (
          <div className={fmzAdminSidebarLayoutConfig.emptyState}>
            Nenhuma página administrativa liberada para este usuário.
          </div>
        )}
      </div>

      <div className={fmzAdminSidebarLayoutConfig.desktopFooter}>
        <FmzAdminSidebarLogoutButton onLogout={onLogout} />
      </div>

      <div className={fmzAdminSidebarLayoutConfig.mobileFooter}>
        <FmzAdminSidebarLogoutButton onLogout={onLogout} compact />
      </div>
    </aside>
  );
}

// ─── Navigation link ──────────────────────────────────────────────────────────

function FmzAdminSidebarLink({
  item,
  locale,
  pathname,
}: {
  item: FmzAdminNavigationItem;
  locale?: string;
  pathname: string | null;
}) {
  const Icon = item.icon;
  const isActive = isAdminSidebarItemActive(pathname, item.href);

  return (
    <Link
      href={buildFmzLocalizedHref(locale, item.href)}
      className={fmzCn(
        fmzAdminSidebarLayoutConfig.link,
        isActive && fmzAdminSidebarLayoutConfig.linkActive,
        !isActive && fmzAdminSidebarLayoutConfig.linkInactive,
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={fmzCn(
          fmzAdminSidebarLayoutConfig.icon,
          isActive
            ? fmzAdminSidebarLayoutConfig.iconActive
            : fmzAdminSidebarLayoutConfig.iconInactive,
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className={fmzAdminSidebarLayoutConfig.label}>{item.label}</span>
    </Link>
  );
}

// ─── Logout button ────────────────────────────────────────────────────────────

function FmzAdminSidebarLogoutButton({
  onLogout,
  compact = false,
}: {
  onLogout: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={fmzCn(
        fmzAdminSidebarLayoutConfig.logoutButton,
        compact && fmzAdminSidebarLayoutConfig.logoutButtonCompact,
      )}
      aria-label={fmzPublicLayoutConfig.connectedLogoutLabel}
    >
      <span className={fmzAdminSidebarLayoutConfig.logoutIcon}>
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className={fmzCn('whitespace-nowrap', compact && 'sr-only')}>
        {fmzPublicLayoutConfig.connectedLogoutLabel}
      </span>
    </button>
  );
}
