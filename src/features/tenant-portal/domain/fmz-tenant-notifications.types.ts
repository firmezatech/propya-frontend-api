// ─── Notification Types ────────────────────────────────────────────────────────
// All notification content is owned by the backend.
// The frontend only maps types to icons and renders backend-provided text.

export type TenantNotificationType =
  | 'boleto_available'
  | 'boleto_due_in_10_days'
  | 'boleto_due_in_2_days'
  | 'boleto_overdue'
  | 'kyc_document_under_review'
  | 'kyc_document_verified'
  | 'kyc_document_rejected'
  | 'kyc_document_needs_resubmission'
  | 'kyc_profile_verified'
  | 'profile_incomplete'
  | string; // Allow forward-compatible extension

export type TenantNotificationStatus = 'delivered' | 'read' | string;

// ─── Notification ─────────────────────────────────────────────────────────────

export type TenantNotification = {
  id: string;
  notificationType: TenantNotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success' | string;
  status: TenantNotificationStatus;
  actionUrl: string | null;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

// ─── API Responses ────────────────────────────────────────────────────────────

export type TenantNotificationsResponse = {
  notifications: TenantNotification[];
};

export type TenantUnreadCountResponse = {
  unreadCount: number;
};

// ─── Query Params ─────────────────────────────────────────────────────────────

export type TenantNotificationsQueryParams = {
  limit?: number;
  status?: string;
};
