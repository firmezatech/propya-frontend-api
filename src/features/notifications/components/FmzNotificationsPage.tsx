'use client';

import { Check, ChevronLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type {
  NotificationItem,
  NotificationTabConfig,
  NotificationVisual,
  NotificationsPageState,
} from '../domain/fmz-notifications.types';
import { FmzNotificationsList } from './FmzNotificationsList';
import { FmzNotificationsToolbar } from './FmzNotificationsToolbar';
import { FmzNotificationsSelectionBar } from './FmzNotificationsSelectionBar';
import { FmzDeleteConfirmModal } from './FmzDeleteConfirmModal';

const ITEMS_PER_PAGE = 8;

// ─── Sub-components ───────────────────────────────────────────────────────────

type FmzPageHeadProps = {
  unreadCount: number;
  backHref: string;
  onMarkAllRead: () => void;
  onDismissAll: () => void;
};

function FmzPageHead({ unreadCount, backHref, onMarkAllRead, onDismissAll }: FmzPageHeadProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Link
          href={backHref}
          className="mb-0.5 inline-flex items-center gap-[5px] text-[12.5px] font-medium text-fmz-text-muted transition-colors hover:text-fmz-navy"
        >
          <ChevronLeft size={12} strokeWidth={2} />
          Voltar ao dashboard
        </Link>
        <div className="flex items-center gap-3">
          <h1
            className="font-bold tracking-[-0.025em] text-fmz-navy"
            style={{ fontSize: 'clamp(26px, 3.4vw, 34px)', lineHeight: 1.05 }}
          >
            Notificações
          </h1>
          {unreadCount > 0 && (
            <span className="mt-1 self-start inline-flex items-center justify-center rounded-full bg-[#E63946] px-2.5 py-0.5 text-xs font-bold tracking-[0.02em] text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onMarkAllRead}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-fmz-border-light bg-white px-4 py-[9px] text-[13px] font-semibold text-fmz-navy transition-all hover:border-[#D0D4DE] hover:bg-[#FAFBFC]"
        >
          <Check size={13} strokeWidth={2} />
          <span>Marcar todas como lidas</span>
        </button>
        <button
          type="button"
          onClick={onDismissAll}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-fmz-border-light bg-white px-4 py-[9px] text-[13px] font-semibold text-[#B23B2D] transition-all hover:border-[#E8C4C0] hover:bg-[#FBEDEB]"
        >
          <Trash2 size={13} strokeWidth={2} />
          <span>Apagar todas</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type FmzPaginationBarProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onGoToPage: (page: number) => void;
};

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function FmzPaginationBar({ currentPage, totalPages, totalCount, onGoToPage }: FmzPaginationBarProps) {
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd   = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <span className="text-[13px] text-fmz-text-muted">
        Mostrando{' '}
        <strong className="font-semibold text-fmz-navy">{pageStart}–{pageEnd}</strong>{' '}
        de{' '}
        <strong className="font-semibold text-fmz-navy">{totalCount}</strong>{' '}
        notificações
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onGoToPage(currentPage - 1)}
          aria-label="Anterior"
          className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-fmz-border-light bg-white text-fmz-navy transition-all hover:enabled:border-[#D0D4DE] hover:enabled:bg-fmz-page disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={13} strokeWidth={2} />
        </button>

        {buildPageRange(currentPage, totalPages).map((item, idx) =>
          item === '…' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-[13px] text-fmz-text-hint">…</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onGoToPage(item as number)}
              aria-current={item === currentPage ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-[9px] border text-[13px] font-medium transition-all ${
                item === currentPage
                  ? 'border-fmz-navy bg-fmz-navy font-semibold text-white'
                  : 'border-fmz-border-light bg-white text-fmz-navy hover:border-[#D0D4DE] hover:bg-fmz-page'
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onGoToPage(currentPage + 1)}
          aria-label="Próxima"
          className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-fmz-border-light bg-white text-fmz-navy transition-all hover:enabled:border-[#D0D4DE] hover:enabled:bg-fmz-page disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={13} strokeWidth={2} className="rotate-180" />
        </button>
      </div>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export type DeleteModalConfig = {
  isOpen: boolean;
  title: string;
  description: string;
};

export type FmzNotificationsPageProps = {
  pageState: NotificationsPageState;
  unreadCount: number;
  tabs: NotificationTabConfig[];
  activeTab: string;
  selectedIds: Set<string>;
  resolveVisual: (type: string) => NotificationVisual;
  backHref: string;
  deleteModal: DeleteModalConfig | null;
  onTabChange: (key: string) => void;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onMarkSelectedRead: () => void;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onDismissSelected: () => void;
  onDeleteModalConfirm: () => void;
  onDeleteModalCancel: () => void;
  onGoToPage: (page: number) => void;
};

export function FmzNotificationsPage({
  pageState,
  unreadCount,
  tabs,
  activeTab,
  selectedIds,
  resolveVisual,
  backHref,
  deleteModal,
  onTabChange,
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
  onGoToPage,
}: FmzNotificationsPageProps) {
  const notifications = pageState.status === 'ready' ? pageState.notifications : [] as NotificationItem[];
  const showPagination = pageState.status === 'ready' && pageState.totalCount > 0;

  return (
    <main className="mx-auto w-full max-w-[1100px] px-[clamp(20px,4vw,48px)] pb-20 pt-[clamp(24px,4vw,40px)]">
      <FmzPageHead
        unreadCount={unreadCount}
        backHref={backHref}
        onMarkAllRead={onMarkAllRead}
        onDismissAll={onDismissAll}
      />

      <FmzNotificationsToolbar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />

      <FmzNotificationsSelectionBar
        selectedCount={selectedIds.size}
        onMarkRead={onMarkSelectedRead}
        onDismiss={onDismissSelected}
        onClose={onClearSelection}
      />

      <div className="overflow-hidden rounded-[20px] border border-fmz-border-light bg-white shadow-[0_1px_2px_rgba(14,22,38,0.04)]">
        {pageState.status === 'loading' && (
          <p className="flex items-center justify-center py-20 text-sm text-fmz-text-muted">Carregando…</p>
        )}
        {pageState.status === 'error' && (
          <p className="flex items-center justify-center py-20 text-sm text-[#B23B2D]">
            Não foi possível carregar as notificações. Tente novamente.
          </p>
        )}
        {(pageState.status === 'ready' || pageState.status === 'idle') && (
          <FmzNotificationsList
            notifications={notifications}
            selectedIds={selectedIds}
            resolveVisual={resolveVisual}
            onToggleSelect={onToggleSelect}
            onMarkRead={onMarkRead}
            onDismiss={onDismiss}
          />
        )}
      </div>

      {showPagination && (
        <FmzPaginationBar
          currentPage={pageState.currentPage}
          totalPages={pageState.totalPages}
          totalCount={pageState.totalCount}
          onGoToPage={onGoToPage}
        />
      )}

      {deleteModal && (
        <FmzDeleteConfirmModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.title}
          description={deleteModal.description}
          onConfirm={onDeleteModalConfirm}
          onCancel={onDeleteModalCancel}
        />
      )}
    </main>
  );
}
