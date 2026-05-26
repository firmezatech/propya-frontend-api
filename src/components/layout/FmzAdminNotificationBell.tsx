'use client';

import { AlertTriangle, Bell, CheckCircle, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { fmzCn } from '../../lib/fmz-classnames';
import type { AdminNotification } from '../../features/admin-notifications/domain/fmz-admin-notifications.types';
import type { AdminNotificationsState } from '../../features/admin-notifications/hooks/use-admin-notifications';

// ─── Props ────────────────────────────────────────────────────────────────────

type FmzAdminNotificationBellProps = {
  unreadCount: number;
  notificationsState: AdminNotificationsState;
  onFetchNotifications: () => Promise<void>;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Compact notification bell for the admin sidebar.
 *
 * Single responsibility: render the bell trigger and the notification panel.
 * All data fetching and state mutations are handled by `useAdminNotifications()`
 * in the parent; this component only receives and renders.
 */
export function FmzAdminNotificationBell({
  unreadCount,
  notificationsState,
  onFetchNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: FmzAdminNotificationBellProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const hasUnread = unreadCount > 0;
  const notifications = notificationsState.status === 'ready' ? notificationsState.notifications : [];

  const togglePanel = useCallback(() => {
    setIsPanelOpen((current) => {
      const willOpen = !current;
      if (willOpen && notificationsState.status === 'idle') {
        void onFetchNotifications();
      }
      return willOpen;
    });
  }, [notificationsState.status, onFetchNotifications]);

  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const handleNotificationClick = useCallback((notification: AdminNotification) => {
    if (!notification.readAt) {
      void onMarkAsRead(notification.id);
    }
  }, [onMarkAsRead]);

  return (
    <div className="relative px-2 pb-1 pt-2">
      {/* Bell trigger */}
      <button
        type="button"
        aria-label="Notificações administrativas"
        aria-haspopup="menu"
        aria-expanded={isPanelOpen}
        onClick={togglePanel}
        className="relative flex w-full items-center gap-2 rounded-[9px] px-3 py-2.5 text-[13px] font-medium text-fmz-text-primary transition hover:bg-fmz-page hover:text-fmz-navy"
      >
        <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-fmz-page text-fmz-navy">
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          {hasUnread ? (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border-2 border-white bg-[#E63946]" />
          ) : null}
        </span>
        <span className="whitespace-nowrap">Notificações</span>
        {hasUnread ? (
          <span className="ml-auto grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#E63946] px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Panel */}
      {isPanelOpen ? (
        <AdminNotificationPanel
          unreadCount={unreadCount}
          notificationsState={notificationsState}
          notifications={notifications}
          onFetchNotifications={onFetchNotifications}
          onMarkAllAsRead={onMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
          onClose={closePanel}
        />
      ) : null}
    </div>
  );
}

// ─── Panel sub-component ──────────────────────────────────────────────────────

type AdminNotificationPanelProps = {
  unreadCount: number;
  notificationsState: AdminNotificationsState;
  notifications: AdminNotification[];
  onFetchNotifications: () => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onNotificationClick: (notification: AdminNotification) => void;
  onClose: () => void;
};

function AdminNotificationPanel({
  unreadCount,
  notificationsState,
  notifications,
  onFetchNotifications,
  onMarkAllAsRead,
  onNotificationClick,
  onClose,
}: AdminNotificationPanelProps) {
  const hasUnread = unreadCount > 0;

  return (
    <div
      role="menu"
      className="absolute left-full top-0 z-[200] ml-2 w-[320px] overflow-hidden rounded-[12px] border border-fmz-border-light bg-white shadow-[0_18px_48px_-12px_rgba(14,22,38,0.18)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EDEFF4] px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-fmz-navy">
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

      {/* Body */}
      <div className="max-h-[400px] overflow-y-auto py-1.5">
        {notificationsState.status === 'loading' ? (
          <LoadingState />
        ) : notificationsState.status === 'error' ? (
          <ErrorState onRetry={onFetchNotifications} />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onClick={() => onNotificationClick(notification)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Panel states ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-fmz-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Carregando notificações...
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <AlertTriangle className="h-5 w-5 text-fmz-text-hint" aria-hidden="true" />
      <p className="text-[13px] text-fmz-text-muted">Não foi possível carregar as notificações.</p>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="text-[12.5px] font-semibold text-fmz-navy underline"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <CheckCircle className="h-5 w-5 text-fmz-text-hint" aria-hidden="true" />
      <p className="text-[13px] text-fmz-text-muted">Nenhuma notificação no momento.</p>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

type NotificationRowProps = {
  notification: AdminNotification;
  onClick: () => void;
};

function NotificationRow({ notification, onClick }: NotificationRowProps) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-fmz-page"
    >
      <span className={fmzCn('mt-1.5 h-2 w-2 shrink-0 rounded-full', isUnread ? 'bg-fmz-gold' : 'bg-transparent')} />
      <span className="min-w-0 flex-1">
        <span className="mb-0.5 block text-[12.5px] font-semibold leading-snug text-fmz-navy">
          {notification.title}
        </span>
        <span className="block text-[12px] leading-relaxed text-fmz-text-muted">
          {notification.message}
        </span>
      </span>
      <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-fmz-text-hint" aria-hidden="true" />
    </button>
  );
}
