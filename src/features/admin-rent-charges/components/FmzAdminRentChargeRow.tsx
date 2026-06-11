'use client';

import { Check, ChevronDown, Loader2, Pencil, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import type {
  FmzAdminRentCharge,
  FmzRentChargeAdjustPayload,
  FmzRentChargeEditableValues,
  FmzRentChargeStatus,
} from '../domain';

// ─── Formatters ───────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Converte string monetária BR (ex: "1.234,56") para número. Retorna 0 para entradas inválidas. */
function parseBrl(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? 0 : parsed;
}

function formatBrl(value: string): string {
  return brlFormatter.format(parseBrl(value));
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<FmzRentChargeStatus, string> = {
  pending_validation: 'Aguardando revisão',
  open: 'Em aberto',
  paid: 'Pago',
};

const STATUS_BADGE_CLASS: Record<FmzRentChargeStatus, string> = {
  pending_validation:
    'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  open: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
  paid: 'bg-[#F0FAF5] text-[#1A8C5B] border border-[#A8DFC4]',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzAdminRentChargeRowProps = {
  charge: FmzAdminRentCharge;
  isExpanded: boolean;
  isEditing: boolean;
  draftValues: FmzRentChargeEditableValues | null;
  adjusting: boolean;
  onToggleExpand: (id: string) => void;
  onStartEditing: (charge: FmzAdminRentCharge) => void;
  onCancelEditing: () => void;
  onDraftFieldChange: (field: keyof FmzRentChargeEditableValues, value: string) => void;
  onSaveAdjust: (id: string, payload: FmzRentChargeAdjustPayload) => void;
  onRequestValidate: (charge: FmzAdminRentCharge) => void;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditableAmountField({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: keyof FmzRentChargeEditableValues;
  value: string;
  onChange: (field: keyof FmzRentChargeEditableValues, value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#9AA3B0]">
          R$
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] py-2 pl-9 pr-3 font-sans text-[15px] font-bold text-[#0D1321] outline-none transition focus:border-[#F5C842] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,200,66,0.13)]"
        />
      </div>
    </label>
  );
}

function AdjustedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#F0D870] bg-[#FFF9E6] px-2 py-0.5 text-[10px] font-semibold text-[#C8A020]">
      Ajustado
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAdjustPayload(
  draft: FmzRentChargeEditableValues,
): FmzRentChargeAdjustPayload {
  return {
    tokenPurchaseAmount: draft.tokenPurchase,
    discountedRentAmount: draft.discountedRent,
    platformAdminFeeAmount: draft.platformAdminFee,
    tokenPurchaseFeeAmount: draft.tokenPurchaseFee,
    reason: 'Ajuste manual pelo admin',
  };
}

const MONTH_NAMES_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

function formatCompetenceMonth(isoDate: string): string {
  if (!isoDate) return '—';
  const [year, month] = isoDate.split('-');
  const monthIndex = parseInt(month ?? '1', 10) - 1;
  return `${MONTH_NAMES_PT[monthIndex] ?? month}/${year}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Linha da tabela de cobranças de aluguel com suporte a:
 * - Modo visualização com accordion de detalhes
 * - Modo edição inline dos 4 campos editáveis
 * - Badge "Ajustado" quando hasManualAdjustment
 * - Botão "Validar" apenas para status pending_validation
 */
export function FmzAdminRentChargeRow({
  charge,
  isExpanded,
  isEditing,
  draftValues,
  adjusting,
  onToggleExpand,
  onStartEditing,
  onCancelEditing,
  onDraftFieldChange,
  onSaveAdjust,
  onRequestValidate,
}: FmzAdminRentChargeRowProps) {
  const displayAmounts = charge.hasManualAdjustment
    ? charge.calculatedAmounts
    : charge.amounts;

  const isPendingValidation = charge.status === 'pending_validation';

  function handleSaveAdjust() {
    if (!draftValues) return;
    onSaveAdjust(charge.id, buildAdjustPayload(draftValues));
  }

  /** Cancela edição inline E fecha o accordion — intenção explícita para o botão X do header. */
  function handleCancelEditingAndCollapse() {
    onCancelEditing();
    onToggleExpand(charge.id);
  }

  return (
    <div
      className={fmzCn(
        'overflow-hidden rounded-xl border-[1.5px] transition-all',
        isExpanded
          ? 'border-[#0D1321] shadow-[0_4px_20px_rgba(13,19,33,0.12)]'
          : 'border-[#E8EAF0] bg-white hover:border-[#F5C842] hover:shadow-[0_4px_20px_rgba(245,200,66,0.15)]',
        charge.status === 'paid' && 'border-[#A8DFC4] bg-[#F0FAF5]',
      )}
    >
      {/* ── Summary row ── */}
      <button
        type="button"
        onClick={() => onToggleExpand(charge.id)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
        aria-expanded={isExpanded}
      >
        {/* Left: icon */}
        <div
          className={fmzCn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]',
            charge.status === 'paid' ? 'bg-[#F0FAF5]' : 'bg-[#FFF9E6]',
          )}
        >
          {charge.status === 'paid' ? (
            <Check size={18} className="text-[#1A8C5B]" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9l9-3 9 3v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
                stroke="#C8A020"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 22V12h6v10"
                stroke="#C8A020"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Center: info */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-sans text-[14px] font-bold text-[#0D1321]">
            {charge.property.address}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-[#5A6478]">
            {charge.tenant.name} · {charge.property.neighborhood}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={fmzCn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
                STATUS_BADGE_CLASS[charge.status],
              )}
            >
              {STATUS_LABEL[charge.status]}
            </span>
            <span className="rounded-[5px] border border-[#E8EAF0] bg-[#F0F1F5] px-2 py-0.5 text-[10.5px] font-semibold text-[#5A6478]">
              {charge.contractCode}
            </span>
            <span className="rounded-[5px] border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[10.5px] font-semibold text-[#2563EB]">
              {charge.tokens.quantity} tokens · {charge.tokens.ownershipPercent}% posse
            </span>
            <span className="rounded-[5px] border border-[#E8EAF0] bg-[#F0F1F5] px-2 py-0.5 text-[10.5px] font-semibold text-[#5A6478]">
              {formatCompetenceMonth(charge.competenceMonth)}
            </span>
            {charge.hasManualAdjustment ? <AdjustedBadge /> : null}
          </div>
        </div>

        {/* Right: values + caret */}
        <div className="hidden flex-shrink-0 items-center gap-6 sm:flex">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
              Aluguel
            </div>
            <div className="font-sans text-[13px] font-bold text-[#0D1321]">
              {formatBrl(displayAmounts.discountedRent)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
              Tokens
            </div>
            <div className="font-sans text-[13px] font-bold text-[#0D1321]">
              {formatBrl(displayAmounts.tokenPurchase)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
              Total
            </div>
            <div className="font-sans text-[13px] font-bold text-[#0D1321]">
              {formatBrl(displayAmounts.gross)}
            </div>
          </div>
        </div>

        {isPendingValidation ? (
          <ChevronDown
            size={16}
            className={fmzCn(
              'flex-shrink-0 text-[#9AA3B0] transition-transform',
              isExpanded && 'rotate-180',
            )}
          />
        ) : null}
      </button>

      {/* ── Detail panel ── */}
      {isExpanded && isPendingValidation ? (
        <div className="border-t border-[#E8EAF0]">
          {/* Panel header */}
          <div className="flex items-center justify-between bg-[#0D1321] px-5 py-3.5">
            <div>
              <div className="font-sans text-[13.5px] font-bold text-white">
                Validar boleto — {charge.tenant.name}
              </div>
              <div className="mt-0.5 text-[11px] text-white/40">
                {charge.property.address} · Venc. {charge.dueDate} · {charge.contractCode}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelEditingAndCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-white/15 bg-white/7 text-white/60 transition hover:bg-white/14 hover:text-white"
              aria-label="Fechar painel"
            >
              <X size={10} />
            </button>
          </div>

          {/* Editable fields or view mode */}
          <div className="bg-white p-5">
            {isEditing && draftValues ? (
              <div className="grid grid-cols-2 gap-4">
                <EditableAmountField
                  label="Valor dos Tokens"
                  field="tokenPurchase"
                  value={draftValues.tokenPurchase}
                  onChange={onDraftFieldChange}
                />
                <EditableAmountField
                  label="Aluguel Mensal"
                  field="discountedRent"
                  value={draftValues.discountedRent}
                  onChange={onDraftFieldChange}
                />
                <EditableAmountField
                  label="Taxa sobre Aluguel"
                  field="platformAdminFee"
                  value={draftValues.platformAdminFee}
                  onChange={onDraftFieldChange}
                />
                <EditableAmountField
                  label="Taxa sobre Compra de Tokens"
                  field="tokenPurchaseFee"
                  value={draftValues.tokenPurchaseFee}
                  onChange={onDraftFieldChange}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    { label: 'Valor dos Tokens', value: displayAmounts.tokenPurchase },
                    { label: 'Aluguel Mensal', value: displayAmounts.discountedRent },
                    { label: 'Taxa sobre Aluguel', value: displayAmounts.platformAdminFee },
                    { label: 'Taxa Compra Tokens', value: displayAmounts.tokenPurchaseFee },
                  ] as const
                ).map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-[9px] border border-[#E8EAF0] bg-[#F7F8FA] px-3.5 py-3"
                  >
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#9AA3B0]">
                      {label}
                    </div>
                    <div className="font-sans text-[15px] font-bold text-[#0D1321]">
                      {formatBrl(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total bar */}
            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#0D1321] px-4 py-3.5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
                  Total a Pagar
                </div>
                <div className="mt-0.5 text-[10px] text-white/30">
                  Vencimento {charge.dueDate}
                </div>
              </div>
              <div className="text-right">
                <div className="font-sans text-[20px] font-extrabold text-white">
                  {formatBrl(displayAmounts.gross)}
                </div>
                {charge.hasManualAdjustment ? (
                  <div className="text-[10px] font-semibold text-[#F5C842]">
                    valor ajustado manualmente
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Panel footer */}
          <div className="flex items-center justify-between gap-3 border-t border-[#E8EAF0] bg-[#F7F8FA] px-5 py-3.5">
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#9AA3B0]">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M8 5v3.5M8 10.5v.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              Será enviado para {charge.tenant.email}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onCancelEditing}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-white px-4 py-2 text-[12.5px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"
                  >
                    <X size={12} /> Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAdjust}
                    disabled={adjusting}
                    className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#0D1321] px-4 py-2 text-[12.5px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#162030] disabled:opacity-60"
                  >
                    {adjusting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Salvar ajuste
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onStartEditing(charge)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-white px-4 py-2 text-[12.5px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"
                  >
                    <Pencil size={12} /> Ajustar valores
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestValidate(charge)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#F5C842] px-5 py-2 font-sans text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#0D1321] shadow-[0_3px_12px_rgba(245,200,66,0.25)] transition hover:-translate-y-0.5 hover:bg-[#C8A020]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
                      <path
                        d="M8 14h8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Gerar boleto
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
