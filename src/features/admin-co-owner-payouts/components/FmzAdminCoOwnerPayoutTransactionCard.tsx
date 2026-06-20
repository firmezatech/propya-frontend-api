'use client';

import { Building2, Coins } from 'lucide-react';
import { FmzAdminCoOwnerPayoutRow } from './FmzAdminCoOwnerPayoutRow';
import type { FmzCoOwnerPayoutRow, FmzCoOwnerPayoutTransaction } from '../domain';

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatEventDate(isoDate: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────
// Card por evento de origem (D-1) — 1 distribution_run/token_order = N co-owners.

export type FmzAdminCoOwnerPayoutTransactionCardProps = {
  transaction: FmzCoOwnerPayoutTransaction;
  selectedRequestIds: Set<string>;
  onToggleSelect: (requestId: string) => void;
  onApproveClick: (row: FmzCoOwnerPayoutRow) => void;
  onRejectClick: (row: FmzCoOwnerPayoutRow) => void;
};

export function FmzAdminCoOwnerPayoutTransactionCard({
  transaction,
  selectedRequestIds,
  onToggleSelect,
  onApproveClick,
  onRejectClick,
}: FmzAdminCoOwnerPayoutTransactionCardProps) {
  const isRent = transaction.sourceType === 'rent_distribution';
  const propertyName = transaction.property.name ?? 'Imóvel não identificado';
  const eventLabel = isRent
    ? `Aluguel · ${transaction.cycleLabel ?? '—'}`
    : `Venda de tokens · ${formatEventDate(transaction.eventDate)}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-fmz-border-light bg-white">
      <div className="flex items-center gap-3 border-b border-fmz-border-light bg-[#FAFBFC] px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#EFF6FF] text-[#2563EB]">
          {isRent ? <Building2 size={17} /> : <Coins size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-bold text-fmz-navy">
            {propertyName}
            {transaction.property.neighborhood ? ` · ${transaction.property.neighborhood}` : ''}
          </div>
          <div className="text-[11.5px] text-fmz-text-muted">{eventLabel}</div>
        </div>
        <span className="shrink-0 text-[11.5px] font-medium text-fmz-text-muted">
          {transaction.rows.length} co-owner{transaction.rows.length === 1 ? '' : 's'}
        </span>
      </div>

      <div>
        {transaction.rows.map((row) => (
          <FmzAdminCoOwnerPayoutRow
            key={`${row.sourceType}:${row.sourceReferenceId}:${row.ownerUserId}`}
            row={row}
            selected={Boolean(row.payoutRequest && selectedRequestIds.has(row.payoutRequest.id))}
            onToggleSelect={onToggleSelect}
            onApproveClick={onApproveClick}
            onRejectClick={onRejectClick}
          />
        ))}
      </div>
    </div>
  );
}
