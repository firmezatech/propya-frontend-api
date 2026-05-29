'use client';

// ─── FmzAdminNotificationBell ─────────────────────────────────────────────────
// Admin-specific notification bell for the admin header.
//
// Responsibility boundary:
//   - Owns the open/close toggle state for the dropdown.
//   - Provides the admin visual mapping (notification type → icon + tone).
//   - Applies isSafeInternalPath before router navigation.
//   - Uses admin notification endpoints ONLY — never tenant endpoints.
//
// Presentational rendering is fully delegated to NotificationBellDropdown.

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  FileSearch,
  UserCircle,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSafeInternalPath } from '../../lib/fmz-safe-url';
import type { AdminNotificationType } from '../../features/admin-notifications/domain/fmz-admin-notifications.types';
import type { AdminNotificationsState } from '../../features/admin-notifications/hooks/fmz-admin-notifications';
import { FmzNotificationBellDropdown } from './notifications/FmzNotificationBellDropdown';
import type {
  DropdownNotification,
  NotificationDropdownState,
  NotificationVisual,
} from './notifications/fmz-notification-bell-dropdown.types';

// Re-export the URL guard for backward-compat with existing tests that import it here.
export { isSafeInternalPath } from '../../lib/fmz-safe-url';

// ─── Visual mapping ───────────────────────────────────────────────────────────

/**
 * Maps a known backend admin notification type to a visual descriptor.
 * All known types must be explicitly handled — the default catches future types only.
 *
 * Exported for unit tests.
 */
export function resolveAdminNotificationVisual(type: AdminNotificationType): NotificationVisual {
  switch (type) {
    case 'admin_kyc_document_pending_review':
      return { icon: FileSearch, tone: 'blue' };
    case 'admin_boleto_overdue':
      return { icon: AlertTriangle, tone: 'gold' };
    case 'admin_payment_issue':
      return { icon: XCircle, tone: 'red' };
    case 'admin_profile_requires_attention':
      return { icon: UserCircle, tone: 'gold' };
    case 'admin_system_job_failed':
      return { icon: AlertCircle, tone: 'red' };
    default:
      return { icon: Bell, tone: 'navy' };
  }
}

// ─── State bridge ─────────────────────────────────────────────────────────────

/**
 * Maps AdminNotificationsState to the shared NotificationDropdownState.
 * Exhaustive switch — any new status added to AdminNotificationsState must be
 * handled here explicitly; TypeScript will flag the gap at compile time.
 */
function bridgeToDropdownState(state: AdminNotificationsState): NotificationDropdownState {
  switch (state.status) {
    case 'ready':   return { status: 'ready', notifications: state.notifications };
    case 'error':   return { status: 'error', message: state.message };
    case 'loading': return { status: 'loading' };
    case 'idle':    return { status: 'idle' };
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type FmzAdminNotificationBellProps = {
  unreadCount: number;
  notificationsState: AdminNotificationsState;
  onFetchNotifications: () => Promise<void>;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Admin notification bell for the admin header.
 *
 * Wraps `NotificationBellDropdown` with:
 *   - admin hook state passed from the parent layout
 *   - admin-specific visual mapping
 *   - safe internal-path navigation guard
 */
export function FmzAdminNotificationBell({
  unreadCount,
  notificationsState,
  onFetchNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: FmzAdminNotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const closePanel = useCallback(() => setIsOpen(false), []);

  const handleToggle = useCallback(() => {
    setIsOpen((current) => {
      const willOpen = !current;
      if (willOpen && notificationsState.status === 'idle') {
        void onFetchNotifications();
      }
      return willOpen;
    });
  }, [notificationsState.status, onFetchNotifications]);

  // Optimistic: navigate immediately; mark-as-read fires in the background.
  // The user should never wait for a server round-trip to navigate.
  const handleNotificationClick = useCallback((notification: DropdownNotification) => {
    if (!notification.readAt) {
      void onMarkAsRead(notification.id);
    }
    if (isSafeInternalPath(notification.actionUrl)) {
      closePanel();
      router.push(notification.actionUrl);
    }
  }, [onMarkAsRead, closePanel, router]);

  // Bridge AdminNotificationsState → NotificationDropdownState.
  // Exhaustive switch — TypeScript will flag any new status not handled here.
  const dropdownState = bridgeToDropdownState(notificationsState);

  return (
    <FmzNotificationBellDropdown
      isOpen={isOpen}
      onToggle={handleToggle}
      onClose={closePanel}
      unreadCount={unreadCount}
      state={dropdownState}
      onFetchNotifications={onFetchNotifications}
      onMarkAllAsRead={onMarkAllAsRead}
      onNotificationClick={handleNotificationClick}
      emptyMessage="Nenhuma notificação administrativa no momento."
      resolveVisual={resolveAdminNotificationVisual}
      triggerAriaLabel="Notificações administrativas"
    />
  );
}
