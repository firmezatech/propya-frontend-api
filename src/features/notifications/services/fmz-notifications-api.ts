import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { NotificationItem } from '../domain/fmz-notifications.types';

const PAGE_LIMIT = 8;

type NotificationsListResponse = {
  notifications: NotificationItem[];
  limit: number;
  offset: number;
};

type UnreadCountResponse = {
  unreadCount: number;
};

export type NotificationsQueryParams = {
  page?: number;
  category?: string;
  status?: string;
  /** Override the default page size. Used by the bell dropdown which needs more items. */
  limit?: number;
};

export async function fetchNotificationsPage(
  params: NotificationsQueryParams = {},
): Promise<{ notifications: NotificationItem[]; totalCount: number }> {
  const { page = 1, category, status, limit = PAGE_LIMIT } = params;
  const offset = (page - 1) * limit;

  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  if (status)   qs.set('status', status);
  if (category) qs.set('category', category);

  const { data } = await firmezaApiClient.get<NotificationsListResponse>(
    `/notifications?${qs.toString()}`,
  );

  const notifications = data.notifications ?? [];
  const totalCount    = offset + notifications.length + (notifications.length === limit ? 1 : 0);
  return { notifications, totalCount };
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await firmezaApiClient.get<UnreadCountResponse>('/notifications/unread-count');
  return data.unreadCount ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await firmezaApiClient.patch(`/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await firmezaApiClient.patch('/notifications/read-all');
}

export async function dismissNotification(id: string): Promise<void> {
  await firmezaApiClient.patch(`/notifications/${encodeURIComponent(id)}/dismiss`);
}

export async function dismissAllNotifications(): Promise<void> {
  await firmezaApiClient.patch('/notifications/dismiss-all');
}

export async function dismissSelectedNotifications(ids: string[]): Promise<void> {
  await firmezaApiClient.patch('/notifications/dismiss-selected', { ids });
}
