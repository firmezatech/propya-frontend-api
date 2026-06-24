'use client';

import type { FmzConnectedUserSummary } from './connected-user/fmz-connected-user.types';

export type FmzConnectedUserIdentityProps = {
  summary: FmzConnectedUserSummary;
};

/**
 * Renders the connected-user chip from a summary computed by the caller.
 * Kept presentational so the admin layout — the only consumer — stays the
 * single source of truth for resolving the principal (backend identity
 * first, localStorage/default as fallback in resolveConnectedUserSummary).
 */
export function FmzConnectedUserIdentity({ summary }: FmzConnectedUserIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-full border-[1.5px] border-fmz-border-light bg-white py-1.5 pl-1.5 pr-3" aria-label="Usuário conectado">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-fmz-navy font-sans text-xs font-bold text-fmz-gold">
        {summary.initials}
      </span>
      <span className="hidden min-w-0 flex-col sm:flex">
        <span className="max-w-[160px] truncate text-[13px] font-semibold text-fmz-text-primary">{summary.name}</span>
        <span className="max-w-[180px] truncate text-[11px] text-fmz-text-hint">{summary.email}</span>
      </span>
    </div>
  );
}
