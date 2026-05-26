'use client';

// ─── FmzAdminHeader ───────────────────────────────────────────────────────────
// Sticky top header for the admin layout.
//
// Structure (left → right):
//   ┌─[Logo area, sidebar-width]──────────┬─[Actions area]───────┐
//   │  FmzBrandMark                        │  🔔 Bell  👤 Identity │
//   └──────────────────────────────────────┴──────────────────────┘
//
// The grid columns mirror the sidebar width so the logo always sits above the
// sidebar and the actions area above the content pane — no layout shift.
//
// Responsibility: render only. All notification state is received as props.

import Link from 'next/link';
import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { fmzAdminShellLayoutConfig } from '../../config/fmz-admin-sidebar-layout-config';
import { fmzCn } from '../../lib/fmz-classnames';
import { FmzBrandMark } from './FmzBrandMark';
import { FmzConnectedUserIdentity } from './FmzConnectedUserIdentity';
import { FmzAdminNotificationBell } from './FmzAdminNotificationBell';
import type { AdminNotificationsState } from '../../features/admin-notifications/hooks/use-admin-notifications';

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzAdminHeaderProps = {
  locale?: string;
  unreadCount: number;
  notificationsState: AdminNotificationsState;
  onFetchNotifications: () => Promise<void>;
  onMarkNotificationAsRead: (id: string) => Promise<void>;
  onMarkAllNotificationsAsRead: () => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzAdminHeader({
  locale,
  unreadCount,
  notificationsState,
  onFetchNotifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
}: FmzAdminHeaderProps) {
  const dashboardHref = locale
    ? `/${locale}${fmzPublicLayoutConfig.connectedDashboardPath}`
    : fmzPublicLayoutConfig.connectedDashboardPath;

  return (
    <header className="sticky top-0 z-50 h-[72px] shrink-0 border-b border-fmz-border-light bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className={fmzCn('grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center', fmzAdminShellLayoutConfig.headerSidebarColumn)}>

        {/* Logo — sits above the sidebar */}
        <Link
          href={dashboardHref}
          aria-label={fmzPublicLayoutConfig.appName}
          className="flex h-full min-w-0 items-center px-[clamp(18px,4vw,48px)] no-underline lg:border-r lg:border-fmz-border-light"
        >
          <FmzBrandMark size="header" />
        </Link>

        {/* Actions area — notification bell + user identity, fixed-width to prevent shift */}
        <div className="flex min-w-[220px] items-center justify-end gap-3 px-[clamp(18px,4vw,48px)]">
          <FmzAdminNotificationBell
            unreadCount={unreadCount}
            notificationsState={notificationsState}
            onFetchNotifications={onFetchNotifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
          />
          <FmzConnectedUserIdentity />
        </div>
      </div>
    </header>
  );
}
