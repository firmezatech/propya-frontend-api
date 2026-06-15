'use client';

import { Bell } from 'lucide-react';
import type { NotificationItem, NotificationVisual } from '../domain/fmz-notifications.types';
import { classifyNotificationDate, DATE_BUCKET_LABELS, DATE_BUCKET_ORDER } from '../domain/fmz-notification-date-grouping';
import type { NotificationDateBucket } from '../domain/fmz-notifications.types';
import { FmzNotificationRow } from './FmzNotificationRow';

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzNotificationsListProps = {
  notifications: NotificationItem[];
  selectedIds: Set<string>;
  resolveVisual: (type: string) => NotificationVisual;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  emptyLabel?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDateBucket(
  notifications: NotificationItem[],
): Map<NotificationDateBucket, NotificationItem[]> {
  const groups = new Map<NotificationDateBucket, NotificationItem[]>();
  for (const n of notifications) {
    const bucket = classifyNotificationDate(n.createdAt);
    const group  = groups.get(bucket);
    if (group) {
      group.push(n);
    } else {
      groups.set(bucket, [n]);
    }
  }
  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzNotificationsList({
  notifications,
  selectedIds,
  resolveVisual,
  onToggleSelect,
  onMarkRead,
  onDismiss,
  emptyLabel = 'Nenhuma notificação encontrada',
}: FmzNotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3.5 px-6 py-[72px] text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fmz-page text-fmz-text-hint">
          <Bell size={24} strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold tracking-[-0.01em] text-fmz-navy">
            {emptyLabel}
          </h3>
          <p className="max-w-[320px] text-[13.5px] leading-relaxed text-fmz-text-muted">
            Não há notificações para este filtro no momento.
          </p>
        </div>
      </div>
    );
  }

  const groups = groupByDateBucket(notifications);

  return (
    <div role="rowgroup">
      {DATE_BUCKET_ORDER.filter((bucket) => groups.has(bucket)).map((bucket) => (
        <div key={bucket}>
          <div className="flex items-center gap-2.5 border-b border-t border-fmz-border-light bg-[#FAFBFC] px-5 py-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-fmz-text-hint first:border-t-0">
            {DATE_BUCKET_LABELS[bucket]}
          </div>
          {groups.get(bucket)!.map((notification) => (
            <FmzNotificationRow
              key={notification.id}
              notification={notification}
              isSelected={selectedIds.has(notification.id)}
              resolveVisual={resolveVisual}
              onToggleSelect={onToggleSelect}
              onMarkRead={onMarkRead}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
