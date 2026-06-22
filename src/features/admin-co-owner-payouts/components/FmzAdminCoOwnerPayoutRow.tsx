'use client';

import { Check, Clock, Lock, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { deriveInitials, deriveAvatarColor } from '../domain/fmz-admin-co-owner-payouts-avatar';
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

function formatPct(value: string | null): string {
  if (value === null) return '—';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  return `${(parsed * 100).toFixed(2).replace('.', ',')}%`;
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

// Linha de FmzAdminCoOwnerPayoutTable (D-11) — colunas do mockup de referência, com o par
// Aprovar/Rejeitar (D-4) mantido em vez do botão único "Aprovar PIX" do mockup (decisão da
// usuária: a rejeição já é um fluxo em produção, não removida pelo rebuild visual).
export function FmzAdminCoOwnerPayoutRow({
  row,
  selected,
  onToggleSelect,
  onApproveClick,
  onRejectClick,
}: FmzAdminCoOwnerPayoutRowProps) {
  const state = deriveRowState(row);
  const selectable = state === 'pending_approval' && Boolean(row.payoutRequest);
  const totalBrl = parseBrl(row.rentShareBrl) + parseBrl(row.tokenSaleShareBrl);
  const hasOwnershipData = row.tokensBefore !== null && row.tokensAfter !== null;
  const deltaPct = hasOwnershipData
    ? (Number(row.ownershipPctAfter) - Number(row.ownershipPctBefore)) * 100
    : 0;

  return (
    <tr className={fmzCn('border-b border-fmz-border-light last:border-0', state === 'below_minimum' && 'opacity-75')}>
      <td className="px-3.5 py-3">
        <div className="flex items-center gap-2.5">
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
          <span
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-[0.02em] text-white"
            style={{ background: deriveAvatarColor(row.ownerUserId) }}
          >
            {deriveInitials(row.ownerName)}
          </span>
          <span className="truncate text-[13px] font-semibold text-fmz-navy">{row.ownerName ?? 'Co-owner sem nome'}</span>
        </div>
      </td>

      <td className="px-3.5 py-3 font-mono text-[12.5px] text-fmz-navy">
        {hasOwnershipData
          ? row.tokensBefore === row.tokensAfter
            ? row.tokensAfter
            : <>{row.tokensBefore} <span className="text-[#9AA3B0]">→</span> <span className="font-semibold">{row.tokensAfter}</span></>
          : '—'}
      </td>

      <td className="px-3.5 py-3">
        {hasOwnershipData ? (
          <div className="flex flex-col gap-0.5">
            <div className="font-mono text-[11.5px] text-fmz-text-muted">{formatPct(row.ownershipPctBefore)}</div>
            <div className="font-mono text-[13px] font-semibold text-fmz-navy">{formatPct(row.ownershipPctAfter)}</div>
            <div className={fmzCn('text-[10px] font-bold', deltaPct === 0 ? 'text-[#9AA3B0]' : 'text-[#D94F3D]')}>
              {deltaPct.toFixed(2).replace('.', ',')} p.p.
            </div>
          </div>
        ) : (
          <span className="text-[#9AA3B0]">—</span>
        )}
      </td>

      <td className="px-3.5 py-3 text-right font-mono text-[13px] text-fmz-navy">
        {row.rentShareBrl !== '0' ? formatBrl(row.rentShareBrl) : <span className="text-[#9AA3B0]">—</span>}
      </td>

      <td className="px-3.5 py-3 text-right font-mono text-[13px] text-fmz-navy">
        {row.tokenSaleShareBrl !== '0' ? formatBrl(row.tokenSaleShareBrl) : <span className="text-[#9AA3B0]">—</span>}
      </td>

      <td className="px-3.5 py-3 text-right">
        <span className="font-mono text-[13px] font-semibold text-fmz-navy">{formatBrl(row.accruedBalanceBrl)}</span>
      </td>

      <td className={fmzCn('px-3.5 py-3 text-right font-mono text-[14px] font-extrabold', state === 'below_minimum' ? 'text-[#9AA3B0]' : 'text-fmz-navy')}>
        {brlFormatter.format(totalBrl)}
      </td>

      <td className="px-3.5 py-3">
        <span className={fmzCn('inline-flex whitespace-nowrap rounded-[5px] px-2 py-1 text-[10.5px] font-bold', STATE_BADGE_CLASS[state])}>
          {STATE_LABEL[state]}
        </span>
      </td>

      <td className="px-3.5 py-3">
        <FmzAdminCoOwnerPayoutRowAction row={row} state={state} onApproveClick={onApproveClick} onRejectClick={onRejectClick} />
      </td>
    </tr>
  );
}

// Botões de ação por estado — extraído para manter a linha legível (9 colunas já são muitas).
function FmzAdminCoOwnerPayoutRowAction({
  row,
  state,
  onApproveClick,
  onRejectClick,
}: {
  row: FmzCoOwnerPayoutRow;
  state: FmzAdminCoOwnerPayoutRowState;
  onApproveClick: (row: FmzCoOwnerPayoutRow) => void;
  onRejectClick: (row: FmzCoOwnerPayoutRow) => void;
}) {
  if (state === 'pending_approval' && row.payoutRequest) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onApproveClick(row)}
          className="inline-flex items-center gap-1 rounded-[8px] border border-fmz-border-light bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1A8C5B] transition-all hover:border-[#A8DFC4] hover:bg-[#F0FAF5]"
        >
          <Check size={13} /> Aprovar
        </button>
        <button
          type="button"
          onClick={() => onRejectClick(row)}
          className="inline-flex items-center gap-1 rounded-[8px] border border-fmz-border-light bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#B23B2D] transition-all hover:border-[#E8C4C0] hover:bg-[#FBEDEB]"
        >
          <X size={13} /> Rejeitar
        </button>
      </div>
    );
  }

  if (state === 'below_minimum') {
    return (
      <span
        title={`Saldo de ${formatBrl(row.accruedBalanceBrl)} ainda abaixo do mínimo de payout. Acumula para o próximo ciclo.`}
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-[8px] border border-fmz-border-light bg-[#F7F8FA] px-2.5 py-1.5 text-[12px] font-semibold text-[#9AA3B0]"
      >
        <Lock size={13} /> Mín. não atingido
      </span>
    );
  }

  if (state === 'eligible') {
    return (
      <span
        title="Elegível, mas o job mensal ainda não criou o pedido de pagamento."
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-[8px] border border-fmz-border-light bg-[#EFF6FF] px-2.5 py-1.5 text-[12px] font-semibold text-[#2563EB]"
      >
        <Clock size={13} /> Aguardando job
      </span>
    );
  }

  if (state === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[8px] border border-fmz-border-light bg-[#F5F3FF] px-2.5 py-1.5 text-[12px] font-semibold text-[#7C3AED]">
        <Clock size={13} /> Em processamento
      </span>
    );
  }

  if (state === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#A8DFC4] bg-[#1A8C5B] px-2.5 py-1.5 text-[12px] font-semibold text-white">
        <Check size={13} /> PIX aprovado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#F5C4BF] bg-[#FEF5F4] px-2.5 py-1.5 text-[12px] font-semibold text-[#D94F3D]">
      <X size={13} /> Rejeitado
    </span>
  );
}
