// ─── Admin Notification Types ─────────────────────────────────────────────────
// All notification content is owned by the backend.
// The frontend maps types to icons and renders backend-provided text only.

export type AdminNotificationType =
  | 'kyc_document_submitted'
  | 'kyc_document_needs_review'
  | 'new_tenant_registered'
  | 'contract_expiring_soon'
  | 'rent_charge_overdue'
  | 'rent_charge_paid'
  | 'support_request_opened'
  | string; // Allow forward-compatible extension

export type AdminNotificationStatus = 'delivered' | 'read' | string;

// ─── Notification ─────────────────────────────────────────────────────────────

export type AdminNotification = {
  id: string;
  notificationType: AdminNotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success' | string;
  status: AdminNotificationStatus;
  actionUrl: string | null;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

// ─── API Responses ────────────────────────────────────────────────────────────

export type AdminNotificationsResponse = {
  notifications: AdminNotification[];
};

export type AdminUnreadCountResponse = {
  unreadCount: number;
};

// ─── Query Params ─────────────────────────────────────────────────────────────

export type AdminNotificationsQueryParams = {
  limit?: number;
  status?: string;
};
