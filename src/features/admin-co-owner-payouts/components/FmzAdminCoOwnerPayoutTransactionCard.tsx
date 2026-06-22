'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Coins, Info, Send } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { deriveAvatarColor } from '../domain/fmz-admin-co-owner-payouts-avatar';
import { deriveRowState } from '../domain/fmz-admin-co-owner-payouts-row-state';
import { deriveTransactionStatus, sumTransactionTotalBrl, type FmzAdminCoOwnerPayoutTransactionStatus } from '../domain/fmz-admin-co-owner-payouts-transaction-status';
import { FmzAdminCoOwnerPayoutRow } from './FmzAdminCoOwnerPayoutRow';
import type { FmzCoOwnerPayoutRow, FmzCoOwnerPayoutTransaction } from '../domain';

// ─── Formatters ───────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseBrl(value: string | null): number {
  if (!value) return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatBrl(value: string | null): string {
  return brlFormatter.format(parseBrl(value));
}

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Badges (D-9) ───────────────────────────────────────────────────────────────

const TX_STATUS_LABEL: Record<FmzAdminCoOwnerPayoutTransactionStatus, string> = {
  pending: 'Pendente',
  partial: 'Parcial',
  done: 'Processado',
};

const TX_STATUS_CLASS: Record<FmzAdminCoOwnerPayoutTransactionStatus, string> = {
  pending: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  partial: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
  done: 'bg-[#F0FAF5] text-[#1A8C5B] border border-[#A8DFC4]',
};

// ─── Component ────────────────────────────────────────────────────────────────
// Card por evento de origem (D-1) — 1 distribution_run/token_order = N co-owners.
// Colapsável (D-8), infobar (D-10), nota de bloqueados e rodapé de aprovação em lote (D-14).

export type FmzAdminCoOwnerPayoutTransactionCardProps = {
  transaction: FmzCoOwnerPayoutTransaction;
  defaultOpen: boolean;
  selectedRequestIds: Set<string>;
  onToggleSelect: (requestId: string) => void;
  onApproveClick: (row: FmzCoOwnerPayoutRow) => void;
  onRejectClick: (row: FmzCoOwnerPayoutRow) => void;
  /** Pede confirmação ao caller (D-4) — nunca aprova direto a partir do card. */
  onApproveEligible: (requestIds: string[]) => void;
};

export function FmzAdminCoOwnerPayoutTransactionCard({
  transaction,
  defaultOpen,
  selectedRequestIds,
  onToggleSelect,
  onApproveClick,
  onRejectClick,
  onApproveEligible,
}: FmzAdminCoOwnerPayoutTransactionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isRent = transaction.sourceType === 'rent_distribution';
  const propertyName = transaction.property.name ?? 'Imóvel não identificado';
  const totalBrl = sumTransactionTotalBrl(transaction);
  const txStatus = deriveTransactionStatus(transaction);

  const approvableRequestIds = transaction.rows
    .filter((row) => deriveRowState(row) === 'pending_approval' && row.payoutRequest)
    .map((row) => row.payoutRequest!.id);

  const blockedRows = transaction.rows.filter((row) => deriveRowState(row) === 'below_minimum');

  const typeBadge = isRent
    ? <span className="inline-flex items-center rounded-[5px] border border-[#C7D0EE] bg-[#EEF2FF] px-[7px] py-[2px] text-[10px] font-bold text-[#4F5FA6]">Ciclo Mensal</span>
    : <span className="inline-flex items-center rounded-[5px] border border-[#DDD6FE] bg-[#F5F3FF] px-[7px] py-[2px] text-[10px] font-bold text-[#7C3AED]">Compra Avulsa</span>;

  const totalSub = isRent ? 'aluguel' : `${transaction.tokenQuantity ?? 0} tokens`;

  return (
    <div className={fmzCn('overflow-hidden rounded-[14px] border-[1.5px] border-fmz-border-light bg-white transition-shadow', isOpen && 'shadow-[0_4px_20px_-4px_rgba(13,19,33,0.07)]')}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center gap-3.5 px-[18px] py-[15px] text-left transition-colors hover:bg-[#FAFBFC]"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-extrabold tracking-[0.02em] text-white"
          style={{ background: deriveAvatarColor(transaction.property.tokenizationId) }}
        >
          {isRent ? <Building2 size={17} /> : <Coins size={17} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 truncate text-[13.5px] font-bold text-fmz-navy">
            {propertyName}
            {typeBadge}
          </span>
          <span className="flex items-center gap-1.5 text-[11.5px] text-fmz-text-muted">
            {transaction.property.neighborhood ?? '—'}
            <span className="h-[3px] w-[3px] rounded-full bg-fmz-border-light" aria-hidden="true" />
            {transaction.rows.length} co-owner{transaction.rows.length === 1 ? '' : 's'}
            <span className="h-[3px] w-[3px] rounded-full bg-fmz-border-light" aria-hidden="true" />
            {formatEventDate(transaction.eventDate)}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-mono text-[15.5px] font-bold text-fmz-navy">{brlFormatter.format(totalBrl)}</span>
          <span className="block text-[10.5px] text-fmz-text-muted">{totalSub}</span>
        </span>

        <span className={fmzCn('inline-flex shrink-0 items-center rounded-[6px] px-[9px] py-1 text-[11px] font-bold', TX_STATUS_CLASS[txStatus])}>
          {TX_STATUS_LABEL[txStatus]}
        </span>

        <span className={fmzCn('flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] border-fmz-border-light text-fmz-text-muted transition-transform', isOpen && 'rotate-180 bg-[#F7F8FA]')}>
          <ChevronDown size={14} />
        </span>
      </button>

      {isOpen && (
        <div>
          <div className="flex flex-wrap items-stretch border-y border-[#F0F1F5] bg-[#F7F8FA]">
            <FmzAdminCoOwnerPayoutInfobarItem label="Inquilina" value={transaction.tenantName ?? '—'} />
            <FmzAdminCoOwnerPayoutInfobarItem label="Referência" value={isRent ? `Ciclo ${transaction.cycleLabel ?? '—'}` : formatEventDate(transaction.eventDate)} />
            <FmzAdminCoOwnerPayoutInfobarItem label="Aluguel pago" value={isRent ? formatBrl(transaction.rentTotalBrl) : '—'} muted={!isRent} />
            <FmzAdminCoOwnerPayoutInfobarItem label="Compra de tokens" value={!isRent && transaction.tokenQuantity ? `${transaction.tokenQuantity} tokens × ${formatBrl(transaction.tokenUnitValueBrl)}` : '—'} muted={isRent} />
            <FmzAdminCoOwnerPayoutInfobarItem label="Total movimentado" value={brlFormatter.format(totalBrl)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead>
                <tr className="bg-[#F7F8FA]">
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Co-proprietário</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Tokens</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">% Posse</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-right text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Do aluguel</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-right text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Da venda tokens</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-right text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Saldo acum.</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-right text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Total PIX</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Status</th>
                  <th className="whitespace-nowrap px-3.5 py-[9px] text-[10px] font-bold uppercase tracking-[0.08em] text-[#9AA3B0]">Ação</th>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>

          {blockedRows.length > 0 && (
            <div className="mx-[18px] mb-3.5 mt-3.5 flex items-start gap-2 rounded-[8px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2.5 text-[12px] leading-relaxed text-[#2563EB]">
              <Info size={14} className="mt-px shrink-0" />
              <span>
                Valor abaixo do mínimo de payout:{' '}
                {blockedRows.map((row, index) => (
                  <span key={row.ownerUserId}>
                    <strong>{(row.ownerName ?? 'Co-owner').split(' ')[0]}</strong> ({formatBrl(row.accruedBalanceBrl)}){index < blockedRows.length - 1 ? ', ' : ''}
                  </span>
                ))}
                . O saldo será acumulado e somado ao próximo ciclo.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F1F5] bg-[#F7F8FA] px-[18px] py-3">
            <span className="text-[12px] text-fmz-text-muted">
              {approvableRequestIds.length > 0 ? (
                <><strong className="text-fmz-navy">{approvableRequestIds.length}</strong> co-proprietário(s) elegível(is) aguardando aprovação</>
              ) : txStatus === 'done' ? (
                'Todos os repasses elegíveis foram aprovados'
              ) : (
                'Nenhum repasse elegível neste ciclo'
              )}
            </span>
            <button
              type="button"
              onClick={() => onApproveEligible(approvableRequestIds)}
              disabled={approvableRequestIds.length === 0}
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-fmz-navy px-3.5 py-2 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:-translate-y-0"
            >
              <Send size={13} />
              {approvableRequestIds.length === 0
                ? (txStatus === 'done' ? 'Todos aprovados' : 'Sem elegíveis')
                : `Aprovar ${approvableRequestIds.length} PIX elegível${approvableRequestIds.length > 1 ? 'eis' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FmzAdminCoOwnerPayoutInfobarItem({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-[3px] border-r border-[#F0F1F5] px-[18px] py-[11px] last:border-r-0">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.09em] text-[#9AA3B0]">{label}</span>
      <span className={fmzCn('font-mono text-[13px] font-semibold', muted ? 'text-fmz-text-muted' : 'text-fmz-navy')}>{value}</span>
    </div>
  );
}
