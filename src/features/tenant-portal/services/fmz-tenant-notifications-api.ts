import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  TenantNotificationsQueryParams,
  TenantNotificationsResponse,
  TenantUnreadCountResponse,
} from '../domain/fmz-tenant-notifications.types';

const DEFAULT_NOTIFICATIONS_LIMIT = 10;

// ─── Fetch Notifications ──────────────────────────────────────────────────────

/**
 * Fetches the latest notifications for the authenticated tenant.
 *
 * Source of truth: GET /tenant/notifications?limit=n
 */
export async function getTenantNotifications({
  limit = DEFAULT_NOTIFICATIONS_LIMIT,
  status,
}: TenantNotificationsQueryParams = {}): Promise<TenantNotificationsResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (status) params.set('status', status);

  const { data } = await firmezaApiClient.get(`/tenant/notifications?${params.toString()}`);
  return data as TenantNotificationsResponse;
}

// ─── Unread Count ─────────────────────────────────────────────────────────────

/**
 * Fetches only the unread count.
 * Lightweight call — used to drive the badge without loading the full list.
 *
 * Source of truth: GET /tenant/notifications/unread-count
 */
export async function getTenantNotificationUnreadCount(): Promise<TenantUnreadCountResponse> {
  const { data } = await firmezaApiClient.get('/tenant/notifications/unread-count');
  return data as TenantUnreadCountResponse;
}

// ─── Mark Single Notification As Read ────────────────────────────────────────

/**
 * Marks a single notification as read.
 *
 * Source of truth: PATCH /tenant/notifications/:id/read
 */
export async function markTenantNotificationAsRead(notificationId: string): Promise<void> {
  await firmezaApiClient.patch(`/tenant/notifications/${encodeURIComponent(notificationId)}/read`);
}

// ─── Mark All As Read ─────────────────────────────────────────────────────────

/**
 * Marks all delivered notifications as read for the authenticated tenant.
 *
 * Source of truth: PATCH /tenant/notifications/read-all
 */
export async function markAllTenantNotificationsAsRead(): Promise<void> {
  await firmezaApiClient.patch('/tenant/notifications/read-all');
}
