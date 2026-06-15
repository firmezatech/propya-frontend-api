'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getTenantNotificationUnreadCount,
  getTenantNotifications,
  markAllTenantNotificationsAsRead,
  markTenantNotificationAsRead,
} from '../../../features/tenant-portal/services/fmz-tenant-notifications-api';
import type { TenantNotification } from '../../../features/tenant-portal/domain/fmz-tenant-notifications.types';

const NOTIFICATIONS_LIMIT = 10;

// ─── State Shape ──────────────────────────────────────────────────────────────

type NotificationsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; notifications: TenantNotification[] }
  | { status: 'error' };

// ─── Hook Return ──────────────────────────────────────────────────────────────

type UseTenantNotificationsReturn = {
  unreadCount: number;
  notificationsState: NotificationsState;
  fetchNotifications: () => Promise<void>;
  handleMarkAsRead: (notificationId: string) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @deprecated Use `useFmzNotifications` from `features/notifications/hooks/fmz-notifications` instead.
 * Kept temporarily until UN-3 (deprecated route removal) — do not use in new code.
 *
 * Manages tenant notification state for the header dropdown.
 */
export function useFmzTenantNotifications(): UseTenantNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsState, setNotificationsState] = useState<NotificationsState>({ status: 'idle' });

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { unreadCount: count } = await getTenantNotificationUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail — the badge simply does not appear; no fake count.
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsState({ status: 'loading' });
    try {
      const { notifications } = await getTenantNotifications({ limit: NOTIFICATIONS_LIMIT });
      setNotificationsState({ status: 'ready', notifications });
    } catch {
      setNotificationsState({ status: 'error' });
    }
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markTenantNotificationAsRead(notificationId);

      // Optimistic update: mark the single notification as read locally.
      setNotificationsState((current) => {
        if (current.status !== 'ready') return current;
        const updated = current.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, status: 'read' as const, readAt: new Date().toISOString() }
            : n,
        );
        return { status: 'ready', notifications: updated };
      });

      // Sync the badge count.
      await fetchUnreadCount();
    } catch {
      // Non-critical: the notification stays as unread in the UI.
    }
  }, [fetchUnreadCount]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllTenantNotificationsAsRead();

      // Optimistic update: mark all notifications as read locally.
      setNotificationsState((current) => {
        if (current.status !== 'ready') return current;
        const now = new Date().toISOString();
        const updated = current.notifications.map((n) => ({
          ...n,
          status: 'read' as const,
          readAt: n.readAt ?? now,
        }));
        return { status: 'ready', notifications: updated };
      });

      setUnreadCount(0);
    } catch {
      // Non-critical: the UI reflects the pre-call state.
    }
  }, []);

  // Fetch unread count on mount — drives the notification badge.
  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    notificationsState,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
  };
}
