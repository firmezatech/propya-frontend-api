'use client';

// ─── FmzNotificationBellDropdown ─────────────────────────────────────────────
// Shared, purely-presentational notification bell + dropdown panel.
//
// Single responsibility: render the UI. All data, hooks, and role-specific
// logic live in the caller (AdminNotificationBell / TenantNotificationBell).
//
// The component is controlled — the parent owns `isOpen` and toggles it.
// Outside-click handling is wired internally and calls `onClose`.

import { AlertTriangle, Bell, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { fmzCn } from '../../../lib/fmz-classnames';
// formatRelativeTime lives in lib/ (pure utility, no React dependency).
// Imported for use in the notification row and re-exported so callers that
// import it from this component file keep working without breaking changes.
import { formatRelativeTime } from '../../../lib/fmz-format-relative-time';
export { formatRelativeTime };
import type {
  DropdownNotification,
  NotificationDropdownState,
  NotificationTone,
  NotificationVisual,
} from './fmz-notification-bell-dropdown.types';

// ─── Tone class names ─────────────────────────────────────────────────────────

const toneClassName: Record<NotificationTone, string> = {
  blue:  'bg-[#E8EFFC] text-[#1F5BD6]',
  gold:  'bg-[#FBF3DA] text-[#8A6B12]',
  red:   'bg-[#FEF2F2] text-[#DC2626]',
  green: 'bg-[#E8F5EE] text-[#127A4F]',
  navy:  'bg-fmz-page text-fmz-navy',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzNotificationBellDropdownProps = {
  /** Controlled open state — the parent decides when the panel is open. */
  isOpen: boolean;
  /** Called when the bell button is clicked. Parent should toggle isOpen. */
  onToggle: () => void;
  /** Called to imperatively close the panel (outside-click, navigation, etc.). */
  onClose: () => void;
  /** Current unread badge count — comes from the backend, never hardcoded. */
  unreadCount: number;
  /** Discriminated-union state from the role-specific hook. */
  state: NotificationDropdownState;
  /** Trigger a (re-)fetch of the full notification list. */
  onFetchNotifications: () => Promise<void>;
  /** Mark all visible notifications as read. */
  onMarkAllAsRead: () => Promise<void>;
  /** Called when a notification row is clicked. Navigation + mark-as-read live here. */
  onNotificationClick: (notification: DropdownNotification) => void | Promise<void>;
  /** Role-specific empty-state copy. e.g. "Nenhuma notificação no momento." */
  emptyMessage: string;
  /** Maps a backend notification type string to { icon, tone }. Role-specific. */
  resolveVisual: (type: string) => NotificationVisual;
  /**
   * Optional footer rendered below the notification list.
   * Wrap content in a `<div className="px-4 py-3">` for consistent padding.
   */
  footerSlot?: ReactNode;
  /** ARIA label for the trigger button. @default "Notificações" */
  triggerAriaLabel?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a notification bell button and its animated dropdown panel.
 *
 * Data flow: parent hook → parent wrapper → this component.
 * No data fetching or role-specific logic lives here.
 */
export function FmzNotificationBellDropdown({
  isOpen,
  onToggle,
  onClose,
  unreadCount,
  state,
  onFetchNotifications,
  onMarkAllAsRead,
  onNotificationClick,
  emptyMessage,
  resolveVisual,
  footerSlot,
  triggerAriaLabel = 'Notificações',
}: FmzNotificationBellDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasUnread = unreadCount > 0;
  const notifications = state.status === 'ready' ? state.notifications : [];

  // Outside-click closes the panel.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative">

      {/* ── Bell trigger ──────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={triggerAriaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={fmzCn(
          'relative grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border-[1.5px] border-fmz-border-light bg-white text-fmz-navy transition hover:-translate-y-0.5 hover:border-fmz-navy',
          isOpen && 'border-fmz-navy -translate-y-0.5',
        )}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {hasUnread ? (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-[9px] w-[9px] rounded-full border-2 border-white bg-[#E63946] shadow-[0_0_0_1px_rgba(230,57,70,0.25)]"
          />
        ) : null}
      </button>

      {/* ── Dropdown panel ────────────────────────────────────────────────── */}
      <div
        role="menu"
        className={fmzCn(
          'pointer-events-none absolute right-0 top-[calc(100%+10px)] z-[200] w-[min(380px,calc(100vw-24px))] origin-top-right scale-[0.98] overflow-hidden rounded-[14px] border border-fmz-border-light bg-white opacity-0 shadow-[0_18px_48px_-12px_rgba(14,22,38,0.18),0_2px_6px_rgba(14,22,38,0.06)] transition duration-150',
          isOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : '-translate-y-1.5',
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-[#EDEFF4] px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-[-0.005em] text-fmz-navy">
            Notificações
            {hasUnread ? (
              <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#E63946] px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2">
            {hasUnread ? (
              <button
                type="button"
                onClick={() => void onMarkAllAsRead()}
                className="rounded-md px-2 py-1 text-xs font-semibold text-fmz-text-muted transition hover:bg-fmz-page hover:text-fmz-navy"
              >
                Marcar todas como lidas
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Fechar notificações"
              onClick={onClose}
              className="rounded-md p-1 text-fmz-text-hint transition hover:bg-fmz-page"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Panel body — loading / error / empty / list */}
        <div className="max-h-[440px] overflow-y-auto py-1.5">
          {state.status === 'loading' ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-fmz-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Carregando notificações...
            </div>
          ) : state.status === 'error' ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangle className="h-5 w-5 text-fmz-text-hint" aria-hidden="true" />
              <p className="text-[13px] text-fmz-text-muted">Não foi possível carregar as notificações.</p>
              <button
                type="button"
                onClick={() => void onFetchNotifications()}
                className="text-[12.5px] font-semibold text-fmz-navy underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle className="h-5 w-5 text-fmz-text-hint" aria-hidden="true" />
              <p className="text-[13px] text-fmz-text-muted">{emptyMessage}</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const { icon: Icon, tone } = resolveVisual(notification.notificationType);
              const isUnread = !notification.readAt;
              const timeLabel = formatRelativeTime(notification.deliveredAt ?? notification.createdAt);

              return (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  onClick={() => void onNotificationClick(notification)}
                  className="grid w-full grid-cols-[auto_32px_1fr] items-start gap-3 px-3 py-3 text-left transition hover:bg-fmz-page"
                >
                  <span
                    className={fmzCn(
                      'mt-3 h-2 w-2 rounded-full',
                      isUnread ? 'bg-fmz-gold shadow-[0_0_0_3px_rgba(232,182,32,0.18)]' : 'bg-transparent',
                    )}
                  />
                  <span className={fmzCn('mt-0.5 grid h-8 w-8 place-items-center rounded-[9px]', toneClassName[tone])}>
                    <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="mb-1 flex items-baseline justify-between gap-2 text-[13px] font-semibold leading-snug tracking-[-0.005em] text-fmz-navy">
                      <span className="truncate">{notification.title}</span>
                      {timeLabel ? (
                        <span className="shrink-0 text-[11px] font-medium text-fmz-text-hint">{timeLabel}</span>
                      ) : null}
                    </span>
                    <span className="block text-[12.5px] leading-relaxed text-fmz-text-muted">
                      {notification.message}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Optional footer (e.g. "Ver todas | Preferências" for tenant) */}
        {footerSlot != null ? (
          <div className="border-t border-[#EDEFF4] bg-[#FAFBFC]">
            {footerSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
