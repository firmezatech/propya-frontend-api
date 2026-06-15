'use client';

import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { isSafeInternalPath } from '../../../lib/fmz-safe-url';
import {
  readStoredConnectedUserEmail,
  readStoredConnectedUserName,
  resolveConnectedUserSummary,
} from '../connected-user/fmz-connected-user-storage';
import { performFirmezaLogout } from '../../../services/auth/fmz-logout';
import type { FmzConnectedDropdownItem } from './fmz-connected-dropdown.types';
import type { FmzConnectedUserSummary } from '../connected-user/fmz-connected-user.types';
import type { TenantNotificationType } from '../../../features/tenant-portal/domain/fmz-tenant-notifications.types';
import { useFmzTenantNotifications } from '../../../features/tenant-portal/hooks/fmz-tenant-notifications';
import { FmzNotificationBellDropdown } from '../notifications/FmzNotificationBellDropdown';
import type {
  DropdownNotification,
  NotificationDropdownState,
  NotificationVisual,
} from '../notifications/fmz-notification-bell-dropdown.types';

// ─── Component props ──────────────────────────────────────────────────────────

type FmzConnectedDropdownProps = {
  items: readonly FmzConnectedDropdownItem[];
  localizeHref: (href: string) => string;
  defaultUserName: string;
  defaultUserEmail: string;
  /** Backend-authoritative identity — takes priority over localStorage. */
  principalName?: string | null;
  principalEmail?: string | null;
  principalInitials?: string | null;
  locale?: string;
  roleLabel?: string;
};

// ─── Active route helper ──────────────────────────────────────────────────────

const isFmzConnectedDropdownItemActive = (
  pathname: string | null,
  href: string,
): boolean => {
  if (!pathname) return false;
  return pathname.endsWith(href) || pathname.includes(`${href}/`);
};

// ─── Tenant notification visual mapping ──────────────────────────────────────
// Maps tenant backend notification types to icons.
// All other notification data (title, message, actionUrl) comes from the backend.

/**
 * Maps a known backend tenant notification type to a visual descriptor.
 * Exported for unit tests — mirrors the pattern of resolveAdminNotificationVisual.
 */
export function resolveTenantNotificationVisual(type: TenantNotificationType): NotificationVisual {
  switch (type) {
    case 'boleto_available':
      return { icon: CreditCard, tone: 'gold' };
    case 'boleto_due_in_10_days':
      return { icon: Calendar, tone: 'blue' };
    case 'boleto_due_in_2_days':
      return { icon: AlertTriangle, tone: 'gold' };
    case 'boleto_overdue':
      return { icon: XCircle, tone: 'red' };
    case 'kyc_document_under_review':
      return { icon: FileSearch, tone: 'blue' };
    case 'kyc_document_verified':
      return { icon: ShieldCheck, tone: 'green' };
    case 'kyc_document_rejected':
      return { icon: ShieldAlert, tone: 'red' };
    case 'kyc_document_needs_resubmission':
      return { icon: ShieldAlert, tone: 'gold' };
    case 'kyc_profile_verified':
      return { icon: ShieldCheck, tone: 'green' };
    case 'profile_incomplete':
      return { icon: UserCircle, tone: 'gold' };
    default:
      return { icon: Bell, tone: 'navy' };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzConnectedDropdown({
  items,
  localizeHref,
  defaultUserName,
  defaultUserEmail,
  principalName = null,
  principalEmail = null,
  principalInitials = null,
  locale,
  roleLabel = 'Inquilina',
}: FmzConnectedDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Resolves the displayed identity from the backend principal first, falling back
  // to localStorage, then email prefix, then the neutral default. Server render and
  // first paint use principal-only (no storage access); the effect re-syncs on the
  // client where localStorage is available.
  const [userSummary, setUserSummary] = useState<FmzConnectedUserSummary>(() =>
    resolveConnectedUserSummary({
      principalName,
      principalEmail,
      principalInitials,
      defaultName: defaultUserName,
      defaultEmail: defaultUserEmail,
    }),
  );

  // ── Tenant notification hook — tenant endpoints ONLY ──────────────────────
  const {
    unreadCount,
    notificationsState,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
  } = useFmzTenantNotifications();

  useEffect(() => {
    // Backend identity wins; localStorage only fills gaps. Re-runs when the principal
    // identity changes (e.g. /me/access resolves after first paint) and on storage events.
    const syncUserSummary = () =>
      setUserSummary(
        resolveConnectedUserSummary({
          principalName,
          principalEmail,
          principalInitials,
          storedName: readStoredConnectedUserName(),
          storedEmail: readStoredConnectedUserEmail(),
          defaultName: defaultUserName,
          defaultEmail: defaultUserEmail,
        }),
      );
    syncUserSummary();
    window.addEventListener('storage', syncUserSummary);
    window.addEventListener('walletChanged', syncUserSummary);
    return () => {
      window.removeEventListener('storage', syncUserSummary);
      window.removeEventListener('walletChanged', syncUserSummary);
    };
  }, [principalName, principalEmail, principalInitials, defaultUserName, defaultUserEmail]);

  // Close both menus on outside click.
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  // ── Menu coordination ─────────────────────────────────────────────────────

  const closeAll = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
  }, []);

  const handleUserMenuToggle = useCallback(() => {
    setIsNotificationsOpen(false);
    setIsUserMenuOpen((current) => !current);
  }, []);

  const handleNotificationToggle = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsNotificationsOpen((current) => {
      const willOpen = !current;
      if (willOpen && notificationsState.status === 'idle') {
        void fetchNotifications();
      }
      return willOpen;
    });
  }, [fetchNotifications, notificationsState.status]);

  const handleNotificationClose = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  // ── Notification click — optimistic mark-as-read + safe navigation ──────
  // Navigates immediately; mark-as-read fires in the background.
  // The user should never wait for a server round-trip to navigate.
  const handleNotificationClick = useCallback(
    (notification: DropdownNotification) => {
      closeAll();
      if (!notification.readAt) {
        void handleMarkAsRead(notification.id);
      }
      // Guard: only navigate to relative paths — never to external URLs.
      if (isSafeInternalPath(notification.actionUrl)) {
        router.push(localizeHref(notification.actionUrl));
      }
    },
    [handleMarkAsRead, closeAll, localizeHref, router],
  );

  const handleItemClick = (item: FmzConnectedDropdownItem) => {
    closeAll();
    if (item.id === 'logout') {
      performFirmezaLogout({ router, locale });
      return;
    }
    router.push(localizeHref(item.href));
  };

  // Bridge useFmzTenantNotifications state → NotificationDropdownState
  const notificationDropdownState: NotificationDropdownState =
    notificationsState.status === 'ready'
      ? { status: 'ready', notifications: notificationsState.notifications }
      : notificationsState.status === 'error'
        ? { status: 'error' }
        : { status: notificationsState.status };

  return (
    <div ref={dropdownRef} className="relative flex items-center gap-2">
      {/* Help link */}
      <button
        type="button"
        aria-label="Ajuda"
        onClick={() => router.push(localizeHref('/connected/coming-soon'))}
        className="hidden items-center gap-1.5 rounded-lg bg-transparent px-3 py-2 text-[13px] font-medium text-fmz-text-muted transition hover:bg-fmz-page hover:text-fmz-navy sm:inline-flex"
      >
        <Shield className="h-3.5 w-3.5" aria-hidden="true" />
        Ajuda
      </button>

      {/* Tenant notification bell — tenant endpoints only */}
      <FmzNotificationBellDropdown
        isOpen={isNotificationsOpen}
        onToggle={handleNotificationToggle}
        onClose={handleNotificationClose}
        unreadCount={unreadCount}
        state={notificationDropdownState}
        onFetchNotifications={fetchNotifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationClick={handleNotificationClick}
        emptyMessage="Nenhuma notificação no momento."
        resolveVisual={resolveTenantNotificationVisual}
        triggerAriaLabel="Notificações"
        footerSlot={
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => {
                closeAll();
                router.push(localizeHref('/connected/notifications'));
              }}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-fmz-navy transition hover:text-[#8A6B12]"
            >
              Ver todas as notificações <ChevronRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                closeAll();
                router.push(localizeHref('/connected/coming-soon'));
              }}
              className="text-xs text-fmz-text-hint transition hover:text-fmz-navy"
            >
              Preferências
            </button>
          </div>
        }
      />

      {/* User menu button */}
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isUserMenuOpen}
          onClick={handleUserMenuToggle}
          className={fmzCn(
            'flex select-none items-center gap-[9px] rounded-full border-[1.5px] border-fmz-border-light bg-white py-1 pl-1 pr-3.5 transition hover:-translate-y-0.5 hover:border-fmz-navy hover:shadow-[0_6px_18px_rgba(14,22,38,0.08)]',
            isUserMenuOpen && 'border-fmz-navy -translate-y-0.5 shadow-[0_6px_18px_rgba(14,22,38,0.08)]',
          )}
        >
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border-[1.5px] border-fmz-gold bg-fmz-navy text-[11px] font-bold tracking-[0.04em] text-fmz-gold shadow-[0_0_0_2px_rgba(232,182,32,0.2)]">
            {userSummary.initials}
          </span>
          <span className="hidden max-w-[130px] truncate text-[13px] font-semibold tracking-[-0.005em] text-fmz-navy sm:inline">
            {userSummary.name}
          </span>
          <ChevronDown
            className={fmzCn(
              'h-3.5 w-3.5 text-fmz-text-hint transition',
              isUserMenuOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        {/* User menu panel */}
        <div
          role="menu"
          className={fmzCn(
            'pointer-events-none absolute right-0 top-[calc(100%+10px)] z-[200] w-[268px] origin-top-right scale-[0.98] rounded-[14px] border border-fmz-border-light bg-white p-2 opacity-0 shadow-[0_18px_48px_-12px_rgba(14,22,38,0.18),0_2px_6px_rgba(14,22,38,0.06)] transition duration-150',
            isUserMenuOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : '-translate-y-1.5',
          )}
        >
          {/* User identity section */}
          <div className="mb-1.5 flex items-center gap-3 border-b border-[#EDEFF4] px-3 pb-3 pt-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-fmz-gold bg-fmz-navy text-xs font-bold tracking-[0.04em] text-fmz-gold shadow-[0_0_0_2px_rgba(232,182,32,0.2)]">
              {userSummary.initials}
            </span>
            <span className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold leading-tight tracking-[-0.005em] text-fmz-navy">
                {userSummary.name}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A6B12] before:h-1.5 before:w-1.5 before:rounded-full before:bg-fmz-gold before:content-['']">
                {roleLabel}
              </p>
            </span>
          </div>

          <div className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-fmz-text-hint">
            Navegar
          </div>

          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = isFmzConnectedDropdownItemActive(pathname, item.href);
            const hasSectionDivider = index > 0 && item.section !== items[index - 1]?.section;
            const isDanger = item.variant === 'danger';

            return (
              <div key={item.id}>
                {hasSectionDivider ? <div className="my-1.5 h-px bg-[#EDEFF4]" /> : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                  className={fmzCn(
                    'group relative flex w-full items-center gap-3 rounded-[9px] border-0 bg-transparent px-3 py-2.5 text-left text-[13.5px] font-medium text-fmz-text-primary transition hover:bg-fmz-page hover:text-fmz-navy',
                    isActive && !isDanger && 'bg-fmz-page font-semibold text-fmz-navy before:absolute before:left-1 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-fmz-gold',
                    isDanger && 'text-fmz-error hover:bg-fmz-error-bg hover:text-fmz-error',
                  )}
                >
                  <span
                    className={fmzCn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-fmz-page text-fmz-navy transition group-hover:bg-[#FBF3DA] group-hover:text-[#8A6B12]',
                      isActive && !isDanger && 'bg-[#FBF3DA] text-[#8A6B12]',
                      isDanger && 'bg-fmz-error-bg text-fmz-error group-hover:bg-fmz-error-bg group-hover:text-fmz-error',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {!isDanger ? (
                    <ChevronRight
                      className="h-3 w-3 shrink-0 text-fmz-text-hint transition group-hover:translate-x-0.5 group-hover:text-fmz-navy"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
