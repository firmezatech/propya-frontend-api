import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  AdminNotificationsResponse,
  AdminUnreadCountResponse,
  AdminNotificationsQueryParams,
} from '../domain/fmz-admin-notifications.types';

// ─── Fetch Notifications ──────────────────────────────────────────────────────

/**
 * Retrieves the paginated list of admin notifications.
 *
 * Source of truth: GET /admin/notifications
 */
export async function getAdminNotifications(
  params: AdminNotificationsQueryParams = {},
): Promise<AdminNotificationsResponse> {
  const { data } = await firmezaApiClient.get('/admin/notifications', { params });
  return data as AdminNotificationsResponse;
}

// ─── Unread Count ─────────────────────────────────────────────────────────────

/**
 * Returns the count of unread notifications for the current admin user.
 *
 * Source of truth: GET /admin/notifications/unread-count
 */
export async function getAdminNotificationUnreadCount(): Promise<AdminUnreadCountResponse> {
  const { data } = await firmezaApiClient.get('/admin/notifications/unread-count');
  return data as AdminUnreadCountResponse;
}

// ─── Mark as Read ─────────────────────────────────────────────────────────────

/**
 * Marks a single notification as read.
 *
 * Source of truth: PATCH /admin/notifications/:id/read
 */
export async function markAdminNotificationAsRead(notificationId: string): Promise<void> {
  await firmezaApiClient.patch(`/admin/notifications/${notificationId}/read`);
}

/**
 * Marks all unread notifications as read for the current admin user.
 *
 * Source of truth: PATCH /admin/notifications/read-all
 */
export async function markAllAdminNotificationsAsRead(): Promise<void> {
  await firmezaApiClient.patch('/admin/notifications/read-all');
}
