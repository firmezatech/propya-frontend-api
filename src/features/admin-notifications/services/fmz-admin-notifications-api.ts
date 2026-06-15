import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  AdminNotificationsResponse,
  AdminUnreadCountResponse,
  AdminNotificationsQueryParams,
} from '../domain/fmz-admin-notifications.types';

// ─── Fetch Notifications ──────────────────────────────────────────────────────

export async function getAdminNotifications(
  params: AdminNotificationsQueryParams = {},
): Promise<AdminNotificationsResponse> {
  const { data } = await firmezaApiClient.get('/notifications', { params });
  return data as AdminNotificationsResponse;
}

export async function getAdminNotificationUnreadCount(): Promise<AdminUnreadCountResponse> {
  const { data } = await firmezaApiClient.get('/notifications/unread-count');
  return data as AdminUnreadCountResponse;
}

export async function markAdminNotificationAsRead(notificationId: string): Promise<void> {
  await firmezaApiClient.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
}

export async function markAllAdminNotificationsAsRead(): Promise<void> {
  await firmezaApiClient.patch('/notifications/read-all');
}
