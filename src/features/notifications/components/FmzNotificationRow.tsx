'use client';

import type { NotificationItem, NotificationVisual } from '../domain/fmz-notifications.types';
import { formatRelativeTime } from '../../../lib/fmz-format-relative-time';
import { fmzCn } from '../../../lib/fmz-classnames';
import { Check, Trash2 } from 'lucide-react';

// ─── Tone styles ──────────────────────────────────────────────────────────────

const TONE_CLASS: Record<NotificationVisual['tone'], string> = {
  gold:  'bg-[#FBF3DA] text-[#8A6B12]',
  green: 'bg-[#E8F5EE] text-[#127A4F]',
  blue:  'bg-[#E8EFFC] text-[#1F5BD6]',
  navy:  'bg-fmz-page text-fmz-navy',
  red:   'bg-[#FBEDEB] text-[#B23B2D]',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzNotificationRowProps = {
  notification: NotificationItem;
  isSelected: boolean;
  resolveVisual: (type: string) => NotificationVisual;
  onToggleSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzNotificationRow({
  notification,
  isSelected,
  resolveVisual,
  onToggleSelect,
  onMarkRead,
  onDismiss,
}: FmzNotificationRowProps) {
  const { id, notificationType, title, message, status, createdAt } = notification;
  const isUnread = status === 'delivered';
  const visual   = resolveVisual(notificationType);
  const Icon     = visual.icon;

  return (
    <div
      role="row"
      aria-selected={isSelected}
      className={fmzCn(
        'group relative grid cursor-pointer border-b border-fmz-border-light transition-colors last:border-b-0',
        'grid-cols-[44px_40px_36px_1fr_auto]',
        isSelected ? 'bg-[oklch(97.5%_0.012_80)]' : 'hover:bg-fmz-page',
      )}
      onClick={() => { if (isUnread) onMarkRead(id); }}
    >
      {/* Checkbox */}
      <div
        className={fmzCn(
          'flex items-center justify-center pl-4 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(id)}
          aria-label="Selecionar notificação"
          className={fmzCn(
            'h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-fmz-border-light bg-white transition-all',
            'checked:border-fmz-navy checked:bg-fmz-navy',
            'hover:border-fmz-navy',
          )}
        />
      </div>

      {/* Unread dot */}
      <div className="flex items-center justify-center px-1">
        <span
          className={fmzCn(
            'h-2 w-2 shrink-0 rounded-full',
            isUnread
              ? 'bg-fmz-gold shadow-[0_0_0_3px_rgba(232,182,32,0.18)]'
              : 'bg-transparent',
          )}
        />
      </div>

      {/* Icon */}
      <div className="flex items-start justify-center pt-[18px] pr-2.5">
        <span className={fmzCn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]', TONE_CLASS[visual.tone])}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 py-4 pr-4">
        <p className={fmzCn(
          'mb-1 text-[13.5px] leading-[1.3] tracking-[-0.008em]',
          isUnread ? 'font-semibold text-fmz-navy' : 'font-medium text-fmz-text-primary',
        )}>
          {title}
        </p>
        <p className="text-[12.5px] leading-[1.5] text-fmz-text-muted">{message}</p>
      </div>

      {/* Meta + actions */}
      <div className="flex shrink-0 flex-col items-end gap-2 py-4 pr-[18px]">
        <span className="whitespace-nowrap text-[11.5px] font-medium text-fmz-text-hint">
          {formatRelativeTime(createdAt)}
        </span>
        <div
          className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {isUnread && (
            <button
              type="button"
              title="Marcar como lida"
              onClick={() => onMarkRead(id)}
              className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-transparent text-fmz-text-hint transition-all hover:border-fmz-border-light hover:bg-fmz-page hover:text-fmz-navy"
            >
              <Check size={13} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            title="Apagar"
            onClick={() => onDismiss(id)}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-transparent text-fmz-text-hint transition-all hover:border-[#E8C4C0] hover:bg-[#FBEDEB] hover:text-[#B23B2D]"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
