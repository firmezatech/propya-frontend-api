'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminNotification } from '../domain/fmz-admin-notifications.types';
import {
  getAdminNotifications,
  getAdminNotificationUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from '../services/fmz-admin-notifications-api';

// ─── State shapes ─────────────────────────────────────────────────────────────

type AdminNotificationsIdle    = { status: 'idle' };
type AdminNotificationsLoading = { status: 'loading' };
type AdminNotificationsReady   = { status: 'ready'; notifications: AdminNotification[] };
type AdminNotificationsError   = { status: 'error'; message: string };

export type AdminNotificationsState =
  | AdminNotificationsIdle
  | AdminNotificationsLoading
  | AdminNotificationsReady
  | AdminNotificationsError;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages admin notifications: unread count (fetched on mount), full list
 * (fetched lazily on first panel open), and mark-as-read interactions.
 *
 * Responsibilities (SRP):
 *   - Fetch unread count immediately on mount
 *   - Fetch full list only when `fetchNotifications()` is called
 *   - Apply optimistic updates for mark-as-read and mark-all-as-read
 *   - Never fall back to hardcoded notification data
 */
export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsState, setNotificationsState] = useState<AdminNotificationsState>({ status: 'idle' });

  // ── Fetch unread count on mount ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const response = await getAdminNotificationUnreadCount();
        if (isMounted) setUnreadCount(response.unreadCount);
      } catch {
        // Failure is silent — badge stays at 0; never show a fake count.
      }
    };

    void loadUnreadCount();
    return () => { isMounted = false; };
  }, []);

  // ── Fetch full list (called when panel opens for the first time) ───────────
  const fetchNotifications = useCallback(async () => {
    setNotificationsState({ status: 'loading' });
    try {
      const response = await getAdminNotifications({ limit: 30 });
      setNotificationsState({ status: 'ready', notifications: response.notifications });
    } catch {
      setNotificationsState({ status: 'error', message: 'Não foi possível carregar as notificações.' });
    }
  }, []);

  // ── Mark single notification as read (optimistic) ─────────────────────────
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    setNotificationsState((current) => {
      if (current.status !== 'ready') return current;
      return {
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 'read' as const, readAt: new Date().toISOString() }
            : notification,
        ),
      };
    });
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await markAdminNotificationAsRead(notificationId);
    } catch {
      // Optimistic update stays; a refetch would correct stale state.
    }
  }, []);

  // ── Mark all as read (optimistic) ─────────────────────────────────────────
  const handleMarkAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotificationsState((current) => {
      if (current.status !== 'ready') return current;
      return {
        ...current,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          status: 'read' as const,
          readAt: notification.readAt ?? now,
        })),
      };
    });
    setUnreadCount(0);

    try {
      await markAllAdminNotificationsAsRead();
    } catch {
      // Optimistic update stays.
    }
  }, []);

  return {
    unreadCount,
    notificationsState,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
  };
}
