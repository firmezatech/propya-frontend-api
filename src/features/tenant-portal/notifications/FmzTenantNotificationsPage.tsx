'use client';

import { FmzNotificationsPage } from '../../notifications/components/FmzNotificationsPage';
import { resolveTenantNotificationVisual } from './fmz-tenant-notification-visuals';
import { useTenantNotificationsPage } from './fmz-use-tenant-notifications-page';

const BACK_HREF = '/connected/dashboard';

export function FmzTenantNotificationsPage() {
  const {
    pageState,
    unreadCount,
    tabs,
    activeTab,
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
  } = useTenantNotificationsPage();

  // Strip onConfirm from the hook's modal config — the shared page component receives
  // confirm/cancel as separate callback props, not embedded in the modal config.
  const pageDeleteModal = deleteModal
    ? { isOpen: deleteModal.isOpen, title: deleteModal.title, description: deleteModal.description }
    : null;

  return (
    <div className="min-h-screen bg-fmz-page">
      {operationError && (
        <div className="mx-auto mt-4 flex w-full max-w-[1100px] items-center justify-between gap-3 rounded-[12px] border border-[#E8C4C0] bg-[#FBEDEB] px-4 py-3 text-[13px] text-[#B23B2D]">
          <span>{operationError}</span>
          <button
            type="button"
            onClick={onClearOperationError}
            className="shrink-0 font-semibold underline-offset-2 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      <FmzNotificationsPage
        pageState={pageState}
        unreadCount={unreadCount}
        tabs={tabs}
        activeTab={activeTab}
        selectedIds={selectedIds}
        resolveVisual={resolveTenantNotificationVisual}
        backHref={BACK_HREF}
        deleteModal={pageDeleteModal}
        onTabChange={onTabChange}
        onGoToPage={onGoToPage}
        onToggleSelect={onToggleSelect}
        onClearSelection={onClearSelection}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
        onMarkSelectedRead={onMarkSelectedRead}
        onDismiss={onDismiss}
        onDismissAll={onDismissAll}
        onDismissSelected={onDismissSelected}
        onDeleteModalConfirm={onDeleteModalConfirm}
        onDeleteModalCancel={onDeleteModalCancel}
      />
    </div>
  );
}
