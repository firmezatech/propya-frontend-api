// ─── Admin Notification Types ─────────────────────────────────────────────────
// All notification content is owned by the backend.
// The frontend maps types to icons and renders backend-provided text only.
// Known backend types are explicitly listed — the string fallback exists only
// for forward compatibility with future types, not as a primary contract.

export type AdminNotificationType =
  | 'admin_kyc_document_pending_review'
  | 'admin_boleto_overdue'
  | 'admin_payment_issue'
  | 'admin_profile_requires_attention'
  | 'admin_system_job_failed'
  | string; // forward-compatible extension — known types must be listed above

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
