'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzFormAlert } from '../../api-errors/components';
import type { FmzAdminKycUser, FmzKycDisplayStatus } from '../domain';
import { useFmzAdminKyc } from '../hooks';
import { FmzAdminKycSummaryStrip } from './FmzAdminKycSummaryStrip';
import { FmzAdminKycUserCard } from './FmzAdminKycUserCard';
import { FmzAdminKycReleaseModal } from './FmzAdminKycReleaseModal';

// ─── Status pill definitions ──────────────────────────────────────────────────

type StatusPill = { value: FmzKycDisplayStatus | ''; label: string };

const STATUS_PILLS: StatusPill[] = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Aguardando' },
  { value: 'in_review', label: 'Em análise' },
  { value: 'verified', label: 'Aprovado' },
  { value: 'declined', label: 'Negado' },
  { value: 'released', label: 'Liberado' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { type: 'success' | 'error'; message: string } | null;

function FmzToast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  if (!toast) return null;

  return (
    <div
      className={fmzCn(
        'fixed bottom-6 left-1/2 z-[400] flex -translate-x-1/2 items-center gap-2.5 rounded-[11px] border px-4 py-3 shadow-[0_8px_30px_rgba(13,19,33,0.15)] animate-[fmzSlideDown_0.25s_ease]',
        toast.type === 'success'
          ? 'border-[#A7F3D0] bg-[#F0FAF5] text-[#1A8C5B]'
          : 'border-[#F5C4BF] bg-[#FEF5F4] text-[#D94F3D]',
      )}
      role="status"
      aria-live="polite"
    >
      {toast.type === 'success' ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5v3.5M8 10.5v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[13px] font-semibold">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 opacity-60 hover:opacity-100"
        aria-label="Fechar notificação"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FmzAdminKycSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[60px] animate-pulse rounded-xl border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA]"
        />
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function FmzAdminKycEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#F7F8FA]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M15.5 15.5L21 21M10 17a7 7 0 100-14 7 7 0 000 14z"
            stroke="#9AA3B0"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="mb-1 text-[14px] font-semibold text-[#0D1321]">
        {filtered ? 'Nenhum usuário encontrado' : 'Nenhum usuário ainda'}
      </p>
      <p className="text-[12.5px] text-[#9AA3B0]">
        {filtered ? 'Tente ajustar os filtros.' : 'Aguarde novos cadastros.'}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FmzAdminKycList() {
  const hook = useFmzAdminKyc();

  const [searchInput, setSearchInput] = useState('');
  const [pendingRelease, setPendingRelease] = useState<FmzAdminKycUser | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  const hasFilters = hook.filters.search !== '' || hook.filters.status !== '';

  function handleSearchChange(value: string) {
    setSearchInput(value);
    hook.setSearch(value);
  }

  function handleReleaseClick(user: FmzAdminKycUser) {
    setPendingRelease(user);
  }

  async function handleReleaseConfirm() {
    if (!pendingRelease) return;
    const success = await hook.releaseUser(pendingRelease.userId);
    setPendingRelease(null);
    if (success) {
      showToast('success', 'Usuário liberado para nova tentativa.');
    } else {
      showToast('error', hook.releaseError?.title ?? 'Erro ao liberar usuário.');
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-sans text-[22px] font-extrabold text-[#0D1321]">
          Verificação de Identidade
        </h1>
        <p className="mt-1 text-[13px] text-[#5A6478]">
          Acompanhe e gerencie o processo de KYC dos usuários.
        </p>
      </div>

      {/* Summary strip */}
      <FmzAdminKycSummaryStrip summary={hook.summary} />

      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B0]"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone…"
            className="w-full rounded-[10px] border-[1.5px] border-[#E8EAF0] bg-white py-2.5 pl-9 pr-4 text-[13px] text-[#0D1321] placeholder:text-[#9AA3B0] focus:border-[#7C3AED] focus:outline-none"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => hook.setStatus(pill.value)}
              className={fmzCn(
                'rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition',
                hook.filters.status === pill.value
                  ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                  : 'border-[#E8EAF0] bg-white text-[#5A6478] hover:border-[#7C3AED] hover:text-[#7C3AED]',
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total count */}
      {!hook.listLoading && hook.users.length > 0 && (
        <div className="mb-3 text-[12px] text-[#9AA3B0]">
          {hook.total} usuário{hook.total !== 1 ? 's' : ''} encontrado{hook.total !== 1 ? 's' : ''}
        </div>
      )}

      {/* Error */}
      <FmzFormAlert error={hook.listError} />

      {/* List */}
      {hook.listLoading && hook.users.length === 0 ? (
        <FmzAdminKycSkeleton />
      ) : hook.users.length === 0 ? (
        <FmzAdminKycEmpty filtered={hasFilters} />
      ) : (
        <div className="space-y-2">
          {hook.users.map((user) => (
            <FmzAdminKycUserCard
              key={user.userId}
              user={user}
              releasing={hook.releasing}
              onReleaseClick={handleReleaseClick}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hook.nextCursor && !hook.listLoading && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={hook.loadMore}
            className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#E8EAF0] bg-white px-6 py-2.5 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"
          >
            Carregar mais
          </button>
        </div>
      )}

      {/* Loading more spinner */}
      {hook.listLoading && hook.users.length > 0 && (
        <div className="mt-5 flex justify-center">
          <Loader2 size={18} className="animate-spin text-[#7C3AED]" />
        </div>
      )}

      {/* Release modal */}
      {pendingRelease && (
        <FmzAdminKycReleaseModal
          user={pendingRelease}
          releasing={hook.releasing}
          onConfirm={handleReleaseConfirm}
          onCancel={() => setPendingRelease(null)}
        />
      )}

      {/* Toast */}
      <FmzToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
