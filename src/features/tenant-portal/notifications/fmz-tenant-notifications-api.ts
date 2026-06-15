import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { NotificationItem } from '../../notifications/domain/fmz-notifications.types';

const PAGE_LIMIT = 8;

// ─── Response shapes ──────────────────────────────────────────────────────────

type NotificationsListResponse = {
  notifications: NotificationItem[];
  limit: number;
  offset: number;
};

type UnreadCountResponse = {
  unreadCount: number;
};

// ─── Query params ─────────────────────────────────────────────────────────────

export type TenantNotificationsQueryParams = {
  page?: number;
  category?: string;
  status?: string;
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchTenantNotificationsPage(
  params: TenantNotificationsQueryParams = {},
): Promise<{ notifications: NotificationItem[]; totalCount: number }> {
  const { page = 1, category, status } = params;
  const offset = (page - 1) * PAGE_LIMIT;

  const qs = new URLSearchParams();
  qs.set('limit', String(PAGE_LIMIT));
  qs.set('offset', String(offset));
  if (status)   qs.set('status', status);
  if (category) qs.set('category', category);

  const { data } = await firmezaApiClient.get<NotificationsListResponse>(
    `/tenant/notifications?${qs.toString()}`,
  );

  // Backend does not return total yet — derive from current page length.
  // If the page is full, there may be more; if not, this is the last page.
  const notifications = data.notifications ?? [];
  const totalCount    = offset + notifications.length + (notifications.length === PAGE_LIMIT ? 1 : 0);

  return { notifications, totalCount };
}

export async function fetchTenantUnreadCount(): Promise<number> {
  const { data } = await firmezaApiClient.get<UnreadCountResponse>('/tenant/notifications/unread-count');
  return data.unreadCount ?? 0;
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markTenantNotificationRead(id: string): Promise<void> {
  await firmezaApiClient.patch(`/tenant/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllTenantNotificationsRead(): Promise<void> {
  await firmezaApiClient.patch('/tenant/notifications/read-all');
}

// ─── Dismiss ──────────────────────────────────────────────────────────────────

export async function dismissTenantNotification(id: string): Promise<void> {
  await firmezaApiClient.patch(`/tenant/notifications/${encodeURIComponent(id)}/dismiss`);
}

export async function dismissAllTenantNotifications(): Promise<void> {
  await firmezaApiClient.patch('/tenant/notifications/dismiss-all');
}

export async function dismissSelectedTenantNotifications(ids: string[]): Promise<void> {
  await firmezaApiClient.patch('/tenant/notifications/dismiss-selected', { ids });
}
