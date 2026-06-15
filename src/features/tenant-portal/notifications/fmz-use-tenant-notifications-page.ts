'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import type {
  NotificationItem,
  NotificationsPageState,
  NotificationTabConfig,
} from '../../notifications/domain/fmz-notifications.types';
import {
  fetchTenantNotificationsPage,
  fetchTenantUnreadCount,
  markTenantNotificationRead,
  markAllTenantNotificationsRead,
  dismissTenantNotification,
  dismissAllTenantNotifications,
  dismissSelectedTenantNotifications,
} from './fmz-tenant-notifications-api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 8;

export const NOTIFICATION_TABS: NotificationTabConfig[] = [
  { key: 'todas',    label: 'Todas'    },
  { key: 'cobranca', label: 'Cobrança' },
  { key: 'tokens',   label: 'Tokens'   },
  { key: 'sistema',  label: 'Sistema'  },
];

// ─── Page-state reducer ───────────────────────────────────────────────────────
// Consolidates fetchState, unreadCount, activeTab, currentPage into a single
// reducer to eliminate interdependent useState calls and make transitions explicit.

type PageState = {
  fetchState:  NotificationsPageState;
  unreadCount: number;
  activeTab:   string;
  currentPage: number;
};

type PageAction =
  | { type: 'load-start' }
  | { type: 'load-success'; notifications: NotificationItem[]; totalCount: number; page: number }
  | { type: 'load-error' }
  | { type: 'set-tab';          key: string }
  | { type: 'set-page';         page: number }
  | { type: 'sync-unread';      count: number }
  | { type: 'mark-read';        id: string;                   now: string }
  | { type: 'mark-many-read';   idSet: ReadonlySet<string>;   now: string }
  | { type: 'mark-all-read';    now: string }
  | { type: 'dismiss-one';      id: string }
  | { type: 'dismiss-all' }
  | { type: 'dismiss-many';     idSet: ReadonlySet<string> };

function computeTotalPages(totalCount: number): number {
  return Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
}

const INITIAL_PAGE_STATE: PageState = {
  fetchState:  { status: 'idle' },
  unreadCount: 0,
  activeTab:   'todas',
  currentPage: 1,
};

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case 'load-start':
      return { ...state, fetchState: { status: 'loading' } };

    case 'load-success':
      return {
        ...state,
        fetchState: {
          status:        'ready',
          notifications: action.notifications,
          currentPage:   action.page,
          totalPages:    computeTotalPages(action.totalCount),
          totalCount:    action.totalCount,
        },
      };

    case 'load-error':
      return { ...state, fetchState: { status: 'error' } };

    case 'set-tab':
      return { ...state, activeTab: action.key, currentPage: 1 };

    case 'set-page':
      return { ...state, currentPage: action.page };

    case 'sync-unread':
      return { ...state, unreadCount: action.count };

    case 'mark-read': {
      if (state.fetchState.status !== 'ready') return state;
      return {
        ...state,
        fetchState: {
          ...state.fetchState,
          notifications: state.fetchState.notifications.map((n) =>
            n.id === action.id
              ? { ...n, status: 'read' as const, readAt: n.readAt ?? action.now }
              : n,
          ),
        },
      };
    }

    case 'mark-many-read': {
      if (state.fetchState.status !== 'ready') return state;
      return {
        ...state,
        fetchState: {
          ...state.fetchState,
          notifications: state.fetchState.notifications.map((n) =>
            action.idSet.has(n.id)
              ? { ...n, status: 'read' as const, readAt: n.readAt ?? action.now }
              : n,
          ),
        },
      };
    }

    case 'mark-all-read': {
      if (state.fetchState.status !== 'ready') return state;
      return {
        ...state,
        unreadCount: 0,
        fetchState: {
          ...state.fetchState,
          notifications: state.fetchState.notifications.map((n) => ({
            ...n,
            status: 'read' as const,
            readAt: n.readAt ?? action.now,
          })),
        },
      };
    }

    case 'dismiss-one': {
      if (state.fetchState.status !== 'ready') return state;
      const notificationsAfterDismiss = state.fetchState.notifications.filter((n) => n.id !== action.id);
      return {
        ...state,
        fetchState: {
          ...state.fetchState,
          notifications: notificationsAfterDismiss,
          totalCount:    Math.max(0, state.fetchState.totalCount - 1),
        },
      };
    }

    case 'dismiss-all':
      if (state.fetchState.status !== 'ready') return state;
      return {
        ...state,
        unreadCount: 0,
        currentPage: 1,
        fetchState: {
          ...state.fetchState,
          notifications: [],
          totalCount:    0,
          totalPages:    1,
          currentPage:   1,
        },
      };

    case 'dismiss-many': {
      if (state.fetchState.status !== 'ready') return state;
      const remaining = state.fetchState.notifications.filter((n) => !action.idSet.has(n.id));
      const removedCount = state.fetchState.notifications.length - remaining.length;
      return {
        ...state,
        fetchState: {
          ...state.fetchState,
          notifications: remaining,
          totalCount:    Math.max(0, state.fetchState.totalCount - removedCount),
        },
      };
    }
  }
}

// ─── Selection reducer ────────────────────────────────────────────────────────

type SelectionAction =
  | { type: 'toggle';      id: string }
  | { type: 'clear' }
  | { type: 'remove-one';  id: string }
  | { type: 'remove-many'; ids: ReadonlySet<string> };

function selectionReducer(state: Set<string>, action: SelectionAction): Set<string> {
  switch (action.type) {
    case 'toggle': {
      const next = new Set(state);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return next;
    }
    case 'clear':
      return new Set();
    case 'remove-one': {
      const next = new Set(state);
      next.delete(action.id);
      return next;
    }
    case 'remove-many': {
      const next = new Set(state);
      action.ids.forEach(id => next.delete(id));
      return next;
    }
    default:
      return state;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeleteModalConfig = {
  isOpen:      boolean;
  title:       string;
  description: string;
  onConfirm:   () => Promise<void>;
};

export type UseTenantNotificationsPageReturn = {
  pageState:            NotificationsPageState;
  unreadCount:          number;
  tabs:                 NotificationTabConfig[];
  activeTab:            string;
  selectedIds:          Set<string>;
  deleteModal:          DeleteModalConfig | null;
  operationError:       string | null;
  onTabChange:          (key: string) => void;
  onGoToPage:           (page: number) => void;
  onToggleSelect:       (id: string) => void;
  onClearSelection:     () => void;
  onMarkRead:           (id: string) => Promise<void>;
  onMarkAllRead:        () => Promise<void>;
  onMarkSelectedRead:   () => Promise<void>;
  onDismiss:            (id: string) => void;
  onDismissAll:         () => void;
  onDismissSelected:    () => void;
  onDeleteModalConfirm: () => Promise<void>;
  onDeleteModalCancel:  () => void;
  onClearOperationError: () => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTenantNotificationsPage(): UseTenantNotificationsPageReturn {
  const [page,           dispatchPage]      = useReducer(pageReducer,      INITIAL_PAGE_STATE);
  const [selectedIds,    dispatchSelection] = useReducer(selectionReducer, new Set<string>());
  const [deleteModal,    setDeleteModal]    = useState<DeleteModalConfig | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const onClearOperationError = useCallback(() => setOperationError(null), []);

  const { currentPage, activeTab } = page;

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const loadPage = useCallback(async (pageNum: number, tab: string) => {
    dispatchPage({ type: 'load-start' });
    try {
      const category = tab === 'todas' ? undefined : tab;
      const { notifications, totalCount } = await fetchTenantNotificationsPage({ page: pageNum, category });
      dispatchPage({ type: 'load-success', notifications, totalCount, page: pageNum });
    } catch (error) {
      console.error('[notifications] page load failed:', error);
      dispatchPage({ type: 'load-error' });
      setOperationError('Não foi possível carregar as notificações. Tente novamente.');
    }
  }, []);

  const syncUnreadCount = useCallback(async () => {
    try {
      const count = await fetchTenantUnreadCount();
      dispatchPage({ type: 'sync-unread', count });
    } catch (error) {
      // Badge sync is cosmetic — count stays at last known value; no user-facing error raised.
      console.error('[notifications] unread count sync failed:', error);
    }
  }, []);

  useEffect(() => { void loadPage(currentPage, activeTab); }, [loadPage, currentPage, activeTab]);
  useEffect(() => { void syncUnreadCount(); }, [syncUnreadCount]);

  // ─── Navigation ────────────────────────────────────────────────────────────

  const onTabChange = useCallback((key: string) => {
    dispatchPage({ type: 'set-tab', key });
    dispatchSelection({ type: 'clear' });
  }, []);

  const onGoToPage = useCallback((pageNum: number) => {
    dispatchPage({ type: 'set-page', page: pageNum });
    dispatchSelection({ type: 'clear' });
  }, []);

  // ─── Selection ─────────────────────────────────────────────────────────────

  const onToggleSelect   = useCallback((id: string) => dispatchSelection({ type: 'toggle', id }), []);
  const onClearSelection = useCallback(() => dispatchSelection({ type: 'clear' }), []);

  // ─── Mark as read ──────────────────────────────────────────────────────────

  const onMarkRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    try {
      await markTenantNotificationRead(id);
      dispatchPage({ type: 'mark-read', id, now });
      await syncUnreadCount();
    } catch (error) {
      console.error('[notifications] mark-read failed:', error);
      setOperationError('Não foi possível marcar a notificação como lida. Tente novamente.');
    }
  }, [syncUnreadCount]);

  const onMarkAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    try {
      await markAllTenantNotificationsRead();
      dispatchPage({ type: 'mark-all-read', now });
    } catch (error) {
      console.error('[notifications] mark-all-read failed:', error);
      setOperationError('Não foi possível marcar todas como lidas. Tente novamente.');
    }
  }, []);

  const onMarkSelectedRead = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const now = new Date().toISOString();
    try {
      await Promise.all([...selectedIds].map(markTenantNotificationRead));
      dispatchPage({ type: 'mark-many-read', idSet: selectedIds, now });
      dispatchSelection({ type: 'remove-many', ids: selectedIds });
      await syncUnreadCount();
    } catch (error) {
      console.error('[notifications] mark-selected-read failed:', error);
      setOperationError('Não foi possível marcar as notificações selecionadas como lidas. Tente novamente.');
    }
  }, [selectedIds, syncUnreadCount]);

  // ─── Dismiss (always confirmed via modal) ──────────────────────────────────

  const executeDismissOne = useCallback(async (id: string) => {
    await dismissTenantNotification(id);
    dispatchPage({ type: 'dismiss-one', id });
    dispatchSelection({ type: 'remove-one', id });
    await syncUnreadCount();
  }, [syncUnreadCount]);

  const executeDismissAll = useCallback(async () => {
    await dismissAllTenantNotifications();
    dispatchPage({ type: 'dismiss-all' });
    dispatchSelection({ type: 'clear' });
    // unreadCount set to 0 inside reducer — no API round-trip needed.
  }, []);

  const executeDismissSelected = useCallback(async (idSet: ReadonlySet<string>) => {
    await dismissSelectedTenantNotifications([...idSet]);
    dispatchPage({ type: 'dismiss-many', idSet });
    dispatchSelection({ type: 'clear' });
    await syncUnreadCount();
  }, [syncUnreadCount]);

  const openDeleteModal = useCallback((config: Omit<DeleteModalConfig, 'isOpen'>) => {
    setDeleteModal({ isOpen: true, ...config });
  }, []);

  const onDismiss = useCallback((id: string) => {
    openDeleteModal({
      title:       'Apagar notificação',
      description: 'Esta notificação será removida permanentemente.',
      onConfirm:   () => executeDismissOne(id),
    });
  }, [openDeleteModal, executeDismissOne]);

  const onDismissAll = useCallback(() => {
    openDeleteModal({
      title:       'Apagar todas as notificações',
      description: 'Todas as notificações desta página serão removidas permanentemente.',
      onConfirm:   executeDismissAll,
    });
  }, [openDeleteModal, executeDismissAll]);

  const onDismissSelected = useCallback(() => {
    const count = selectedIds.size;
    openDeleteModal({
      title:       `Apagar ${count} notificação${count !== 1 ? 'ões' : ''}`,
      description: 'As notificações selecionadas serão removidas permanentemente.',
      onConfirm:   () => executeDismissSelected(selectedIds),
    });
  }, [selectedIds, openDeleteModal, executeDismissSelected]);

  // Closes modal immediately so the UI is responsive, then runs the operation.
  // Errors surface via operationError rather than keeping the modal open.
  const onDeleteModalConfirm = useCallback(async () => {
    if (!deleteModal) return;
    const { onConfirm } = deleteModal;
    setDeleteModal(null);
    try {
      await onConfirm();
    } catch (error) {
      console.error('[notifications] dismiss operation failed:', error);
      setOperationError('Não foi possível apagar. Tente novamente.');
    }
  }, [deleteModal]);

  const onDeleteModalCancel = useCallback(() => setDeleteModal(null), []);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    pageState:   page.fetchState,
    unreadCount: page.unreadCount,
    tabs:        NOTIFICATION_TABS,
    activeTab:   page.activeTab,
    selectedIds,
    deleteModal,
    operationError,
    onTabChange,
    onGoToPage,
    onToggleSelect,
    onClearSelection,
    onMarkRead,
    onMarkAllRead,
    onMarkSelectedRead,
    onDismiss,
    onDismissAll,
    onDismissSelected,
    onDeleteModalConfirm,
    onDeleteModalCancel,
    onClearOperationError,
  };
}
