'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NotificationItem } from '../domain/fmz-notifications.types';
import {
  fetchNotificationsPage,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/fmz-notifications-api';

const DROPDOWN_LIMIT = 20;

// ─── State ────────────────────────────────────────────────────────────────────

export type NotificationsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; notifications: NotificationItem[] }
  | { status: 'error'; message: string };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsState, setNotificationsState] = useState<NotificationsState>({ status: 'idle' });

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silent — badge stays at 0; never show a fake count.
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsState({ status: 'loading' });
    try {
      const { notifications } = await fetchNotificationsPage({ page: 1, limit: DROPDOWN_LIMIT });
      setNotificationsState({ status: 'ready', notifications });
    } catch {
      setNotificationsState({ status: 'error', message: 'Não foi possível carregar as notificações.' });
    }
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    // Optimistic update first — the API call confirms it asynchronously.
    setNotificationsState((current) => {
      if (current.status !== 'ready') return current;
      return {
        ...current,
        notifications: current.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n,
        ),
      };
    });
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // Optimistic update stays; a refetch would correct stale state.
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotificationsState((current) => {
      if (current.status !== 'ready') return current;
      return {
        ...current,
        notifications: current.notifications.map((n) => ({
          ...n,
          status: 'read' as const,
          readAt: n.readAt ?? now,
        })),
      };
    });
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // Optimistic update stays.
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  return { unreadCount, notificationsState, fetchNotifications, handleMarkAsRead, handleMarkAllAsRead };
}
