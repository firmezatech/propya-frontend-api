'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { FmzAdminNavigationItem } from '../../config/fmz-admin-navigation-config';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { fmzCn } from '../../lib/fmz-classnames';
import type { FmzConnectedUserSummary } from './connected-user/fmz-connected-user.types';

export type FmzAdminSidebarProps = {
  locale?: string;
  pathname: string | null;
  currentUser: FmzConnectedUserSummary;
  effectivePermissionKeys: Set<string>;
  navigationItems: readonly FmzAdminNavigationItem[];
  onLogout: () => void;
};

const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${href}`;

const isAdminSidebarItemActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(href) || pathname.includes(`${href}/`);
};

export function FmzAdminSidebar({
  locale,
  pathname,
  currentUser,
  effectivePermissionKeys,
  navigationItems,
  onLogout,
}: FmzAdminSidebarProps) {
  const visibleItems = navigationItems.filter((item) => !item.requiredPermissionKey || effectivePermissionKeys.has(item.requiredPermissionKey.toLowerCase()));

  return (
    <aside className="sticky top-[72px] z-30 flex shrink-0 border-b border-fmz-border-light bg-white lg:h-[calc(100vh-72px)] lg:w-[clamp(260px,18vw,340px)] lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:px-3 lg:py-5">
        {visibleItems.length ? visibleItems.map((item) => (
          <FmzAdminSidebarLink key={item.id} item={item} locale={locale} pathname={pathname} />
        )) : (
          <div className="hidden rounded-lg border border-dashed border-fmz-border-light px-3 py-4 text-xs leading-5 text-fmz-text-hint lg:block">
            Nenhuma página administrativa liberada para este usuário.
          </div>
        )}
      </div>

      <div className="hidden border-t border-fmz-border-light p-3 lg:block">
        <FmzAdminSidebarLogoutButton onLogout={onLogout} />
      </div>

      <div className="shrink-0 border-l border-fmz-border-light p-3 lg:hidden">
        <FmzAdminSidebarLogoutButton onLogout={onLogout} compact />
      </div>
    </aside>
  );
}

function FmzAdminSidebarLink({ item, locale, pathname }: { item: FmzAdminNavigationItem; locale?: string; pathname: string | null }) {
  const Icon = item.icon;
  const isActive = isAdminSidebarItemActive(pathname, item.href);

  return (
    <Link
      href={buildFmzLocalizedHref(locale, item.href)}
      className={fmzCn(
        'flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] no-underline transition lg:w-full',
        isActive && 'bg-[#F0F1F5] font-medium text-fmz-navy',
        !isActive && 'text-fmz-text-muted hover:bg-fmz-page hover:text-fmz-text-primary',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={fmzCn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
          isActive ? 'border-fmz-navy bg-fmz-navy text-white' : 'border-fmz-border-light bg-fmz-page',
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-4 lg:whitespace-normal">{item.label}</span>
    </Link>
  );
}

function FmzAdminSidebarLogoutButton({ onLogout, compact = false }: { onLogout: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={fmzCn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-fmz-error transition hover:bg-fmz-error-bg hover:text-fmz-error lg:w-full',
        compact && 'justify-center px-2',
      )}
      aria-label={fmzPublicLayoutConfig.connectedLogoutLabel}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#F5C4BF] bg-fmz-error-bg text-fmz-error">
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className={fmzCn('whitespace-nowrap', compact && 'sr-only')}>{fmzPublicLayoutConfig.connectedLogoutLabel}</span>
    </button>
  );
}
