import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  TenantNotificationsQueryParams,
  TenantNotificationsResponse,
  TenantUnreadCountResponse,
} from '../domain/fmz-tenant-notifications.types';

const DEFAULT_NOTIFICATIONS_LIMIT = 10;

// ─── Fetch Notifications ──────────────────────────────────────────────────────

export async function getTenantNotifications({
  limit = DEFAULT_NOTIFICATIONS_LIMIT,
  status,
}: TenantNotificationsQueryParams = {}): Promise<TenantNotificationsResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (status) params.set('status', status);

  const { data } = await firmezaApiClient.get(`/notifications?${params.toString()}`);
  return data as TenantNotificationsResponse;
}

export async function getTenantNotificationUnreadCount(): Promise<TenantUnreadCountResponse> {
  const { data } = await firmezaApiClient.get('/notifications/unread-count');
  return data as TenantUnreadCountResponse;
}

export async function markTenantNotificationAsRead(notificationId: string): Promise<void> {
  await firmezaApiClient.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
}

export async function markAllTenantNotificationsAsRead(): Promise<void> {
  await firmezaApiClient.patch('/notifications/read-all');
}
