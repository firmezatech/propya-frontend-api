'use client';

import { Check, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { deriveRowState, type FmzAdminCoOwnerPayoutRowState } from '../domain/fmz-admin-co-owner-payouts-row-state';
import type { FmzCoOwnerPayoutRow } from '../domain';

// ─── Formatters ───────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseBrl(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatBrl(value: string): string {
  return brlFormatter.format(parseBrl(value));
}

// ─── Status config (D-2) ──────────────────────────────────────────────────────

const STATE_LABEL: Record<FmzAdminCoOwnerPayoutRowState, string> = {
  below_minimum: 'Abaixo do mínimo',
  eligible: 'Elegível',
  pending_approval: 'Aguardando aprovação',
  processing: 'Em processamento',
  paid: 'Pago',
  rejected: 'Rejeitado',
};

const STATE_BADGE_CLASS: Record<FmzAdminCoOwnerPayoutRowState, string> = {
  below_minimum: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
  eligible: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
  pending_approval: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  processing: 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]',
  paid: 'bg-[#F0FAF5] text-[#1A8C5B] border border-[#A8DFC4]',
  rejected: 'bg-[#FEF5F4] text-[#D94F3D] border border-[#F5C4BF]',
};

// ─── Component ────────────────────────────────────────────────────────────────

export type FmzAdminCoOwnerPayoutRowProps = {
  row: FmzCoOwnerPayoutRow;
  selected: boolean;
  onToggleSelect: (requestId: string) => void;
  onApproveClick: (row: FmzCoOwnerPayoutRow) => void;
  onRejectClick: (row: FmzCoOwnerPayoutRow) => void;
};

export function FmzAdminCoOwnerPayoutRow({
  row,
  selected,
  onToggleSelect,
  onApproveClick,
  onRejectClick,
}: FmzAdminCoOwnerPayoutRowProps) {
  const state = deriveRowState(row);
  const selectable = state === 'pending_approval' && Boolean(row.payoutRequest);
  const shareBrl = row.sourceType === 'token_sale' ? row.tokenSaleShareBrl : row.rentShareBrl;

  return (
    <div className="flex items-center gap-3 border-b border-fmz-border-light px-4 py-3 last:border-0">
      {selectable ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => row.payoutRequest && onToggleSelect(row.payoutRequest.id)}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-fmz-border-light"
          aria-label={`Selecionar pedido de ${row.ownerName ?? 'co-owner'}`}
        />
      ) : (
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-fmz-navy">
          {row.ownerName ?? 'Co-owner sem nome'}
        </div>
        <div className="text-[12px] text-fmz-text-muted">
          Crédito deste evento: {formatBrl(shareBrl)} · Saldo acumulado: {formatBrl(row.accruedBalanceBrl)}
        </div>
      </div>

      <span className={fmzCn('whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold', STATE_BADGE_CLASS[state])}>
        {STATE_LABEL[state]}
      </span>

      {state === 'pending_approval' && row.payoutRequest && (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onApproveClick(row)}
            className="inline-flex items-center gap-1 rounded-[8px] border border-fmz-border-light bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1A8C5B] transition-all hover:bg-[#F0FAF5] hover:border-[#A8DFC4]"
          >
            <Check size={13} /> Aprovar
          </button>
          <button
            type="button"
            onClick={() => onRejectClick(row)}
            className="inline-flex items-center gap-1 rounded-[8px] border border-fmz-border-light bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#B23B2D] transition-all hover:bg-[#FBEDEB] hover:border-[#E8C4C0]"
          >
            <X size={13} /> Rejeitar
          </button>
        </div>
      )}
    </div>
  );
}
