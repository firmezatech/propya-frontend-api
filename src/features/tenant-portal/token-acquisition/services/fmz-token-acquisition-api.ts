// Resolves a pending token-acquisition celebration from the tenant's notifications and marks it
// claimed. Reuses the existing tenant-notification endpoints — no new backend route needed.

import {
  getTenantNotifications,
  markTenantNotificationAsRead,
} from '../../services/fmz-tenant-notifications-api';
import type { TenantNotification } from '../../domain/fmz-tenant-notifications.types';
import type {
  PendingTokenAcquisitionCelebration,
  TokenAcquisitionCelebration,
} from '../domain/fmz-token-acquisition.types';

export const TOKEN_PURCHASE_SETTLED_TYPE = 'token_purchase_settled';

const isUnread = (notification: TenantNotification): boolean => notification.readAt == null;

const extractCelebration = (notification: TenantNotification): TokenAcquisitionCelebration | null => {
  const celebration = (notification.metadata as { celebration?: TokenAcquisitionCelebration } | null | undefined)?.celebration;
  return celebration ?? null;
};

/**
 * Returns the most recent UNREAD token-acquisition celebration, or null when there is none.
 * Drives both the auto-redirect on login and the celebration page itself.
 */
export async function getPendingTokenAcquisitionCelebration(): Promise<PendingTokenAcquisitionCelebration | null> {
  const { notifications } = await getTenantNotifications({ limit: 20, status: 'delivered' });

  const pending = notifications.find(
    (notification) => notification.notificationType === TOKEN_PURCHASE_SETTLED_TYPE && isUnread(notification),
  );
  if (!pending) return null;

  const celebration = extractCelebration(pending);
  if (!celebration) return null;

  return { notificationId: pending.id, celebration };
}

/** Marks the celebration notification read so it is shown once (claim-once). */
export async function acknowledgeTokenAcquisitionCelebration(notificationId: string): Promise<void> {
  await markTenantNotificationAsRead(notificationId);
}
