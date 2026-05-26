import type { LucideIcon } from 'lucide-react';

// ─── Visual ───────────────────────────────────────────────────────────────────

export type NotificationTone = 'blue' | 'gold' | 'red' | 'green' | 'navy';

export type NotificationVisual = {
  /** Any Lucide icon. Using LucideIcon ensures correct prop types. */
  icon: LucideIcon;
  tone: NotificationTone;
};

// ─── Notification item ────────────────────────────────────────────────────────
// Minimum shape required by the dropdown — a structural subtype of both
// AdminNotification and TenantNotification.

export type DropdownNotification = {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  actionUrl: string | null;
};

// ─── Dropdown state ───────────────────────────────────────────────────────────

export type NotificationDropdownState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; notifications: DropdownNotification[] }
  | { status: 'error'; message?: string };
