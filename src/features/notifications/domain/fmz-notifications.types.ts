import type { LucideIcon } from 'lucide-react';

// ─── Visual ───────────────────────────────────────────────────────────────────
// Re-declared here so shared components have no dependency on the bell-dropdown
// module. Must stay structurally compatible with that module's NotificationVisual.

export type NotificationTone = 'blue' | 'gold' | 'red' | 'green' | 'navy';

export type NotificationVisual = {
  icon: LucideIcon;
  tone: NotificationTone;
};

// ─── Notification item ────────────────────────────────────────────────────────
// Shared superset used by both the full-page list and future role variants.
// Must not reference any role-specific concept (tenant / admin / coowner).

export type NotificationItem = {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success' | string;
  status: 'delivered' | 'read' | 'dismissed' | string;
  actionUrl: string | null;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

// ─── Date bucket ──────────────────────────────────────────────────────────────

export type NotificationDateBucket = 'hoje' | 'semana' | 'antes';

// ─── Tab config ───────────────────────────────────────────────────────────────
// Callers configure tabs via props — no hardcoding of category names in shared
// components. Allows each role to define its own tab set.

export type NotificationTabConfig = {
  /** Unique key used as filter value (e.g. 'all' | 'unread' | 'cobranca'). */
  key: string;
  /** Display label shown in the toolbar. */
  label: string;
  /** Optional count shown as a badge. undefined = no badge. */
  badge?: number;
};

// ─── Page state (passed from hook to shell component) ────────────────────────

export type NotificationsPageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'ready';
      notifications: NotificationItem[];
      currentPage: number;
      totalPages: number;
      totalCount: number;
    };
