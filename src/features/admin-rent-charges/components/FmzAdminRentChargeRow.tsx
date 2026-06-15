'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, HelpCircle, RotateCcw, X } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import type {
  FmzAdminRentCharge,
  FmzRentChargeEditableValues,
  FmzRentChargeStatus,
} from '../domain';

// ─── Formatters ───────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function parseBrl(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? 0 : parsed;
}

function formatBrl(value: string): string {
  return brlFormatter.format(parseBrl(value));
}

function parseNum(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<FmzRentChargeStatus, string> = {
  pending_validation: 'Aguardando revisão',
  open: 'Em aberto',
  paid: 'Pago',
};

const STATUS_BADGE_CLASS: Record<FmzRentChargeStatus, string> = {
  pending_validation: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  open: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
  paid: 'bg-[#F0FAF5] text-[#1A8C5B] border border-[#A8DFC4]',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Returns "Calculado: R$ X.XX" when |draft − original| > R$0.005, else null. */
function calcDiff(draftVal: string, origVal: string): string | null {
  return Math.abs(parseNum(draftVal) - parseNum(origVal)) > 0.005
    ? `Calculado: ${formatBrl(origVal)}`
    : null;
}

function toEditableValues(amounts: FmzAdminRentCharge['amounts']): FmzRentChargeEditableValues {
  return {
    tokenPurchase:    amounts.tokenPurchase,
    discountedRent:   amounts.discountedRent,
    platformAdminFee: amounts.platformAdminFee,
    tokenPurchaseFee: amounts.tokenPurchaseFee,
    condominiumFee:   amounts.condominiumFee,
  };
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

type TooltipPlacement = 'left' | 'center' | 'right';

const TOOLTIP_POSITION: Record<TooltipPlacement, string> = {
  left:   'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right:  'right-0',
};

const CARET_POSITION: Record<TooltipPlacement, string> = {
  left:   'left-2',
  center: 'left-1/2 -translate-x-1/2',
  right:  'right-2',
};

function FmzTooltip({ content, placement = 'center' }: { content: string; placement?: TooltipPlacement }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="ml-1 text-[#9AA3B0] transition hover:text-[#5A6478]"
        aria-label="Mais informações"
        tabIndex={0}
      >
        <HelpCircle size={11} />
      </button>
      {visible && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full z-50 mb-2 max-w-[240px] break-words rounded-[7px] bg-[#0D1321] px-3 py-1.5 text-[11px] font-medium leading-5 text-white shadow-lg ${TOOLTIP_POSITION[placement]}`}
        >
          {content}
          <span className={`absolute top-full border-4 border-transparent border-t-[#0D1321] ${CARET_POSITION[placement]}`} />
        </span>
      )}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type FmzAdminRentChargeRowProps = {
  charge: FmzAdminRentCharge;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onRequestValidate: (charge: FmzAdminRentCharge, draft: FmzRentChargeEditableValues) => void;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AdjustedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#F0D870] bg-[#FFF9E6] px-2 py-0.5 text-[10px] font-semibold text-[#C8A020]">
      Ajustado
    </span>
  );
}

function EditableAmountField({
  label,
  field,
  value,
  hint,
  tooltip,
  tooltipPlacement,
  onChange,
}: {
  label: string;
  field: keyof FmzRentChargeEditableValues;
  value: string;
  hint: string | null;
  tooltip?: string;
  tooltipPlacement?: TooltipPlacement;
  onChange: (field: keyof FmzRentChargeEditableValues, value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
        {label}
        {tooltip ? <FmzTooltip content={tooltip} placement={tooltipPlacement} /> : null}
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
      {hint ? (
        <div className="mt-1 text-[10px] font-semibold text-[#C8A020]">✎ {hint}</div>
      ) : null}
    </label>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzAdminRentChargeRow({
  charge,
  isExpanded,
  onToggleExpand,
  onRequestValidate,
}: FmzAdminRentChargeRowProps) {
  const [draft, setDraft] = useState<FmzRentChargeEditableValues>(
    () => toEditableValues(charge.calculatedAmounts),
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isExpanded) setDraft(toEditableValues(charge.calculatedAmounts)); }, [isExpanded]);

  const liveTotal =
    parseNum(draft.tokenPurchase) +
    parseNum(draft.discountedRent) +
    parseNum(draft.platformAdminFee) +
    parseNum(draft.tokenPurchaseFee) +
    parseNum(draft.condominiumFee);
  const liveTotalStr = liveTotal.toFixed(2);

  const anyDirtyFromCalc =
    parseNum(draft.tokenPurchase)    !== parseNum(charge.amounts.tokenPurchase)    ||
    parseNum(draft.discountedRent)   !== parseNum(charge.amounts.discountedRent)   ||
    parseNum(draft.platformAdminFee) !== parseNum(charge.amounts.platformAdminFee) ||
    parseNum(draft.tokenPurchaseFee) !== parseNum(charge.amounts.tokenPurchaseFee) ||
    parseNum(draft.condominiumFee)   !== parseNum(charge.amounts.condominiumFee);

  const handleFieldChange = useCallback(
    (field: keyof FmzRentChargeEditableValues, value: string) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleRecalculate = useCallback(() => {
    setDraft(toEditableValues(charge.amounts));
  }, [charge.amounts]);

  const isPendingValidation = charge.status === 'pending_validation';

  // ── Tooltip content ────────────────────────────────────────────────────────
  const bd = charge.breakdown;
  const tooltipDiscountedRent =
    `${formatBrl(bd.discountedRent.baseRent)} − ${bd.discountedRent.ownershipPct}% de posse (${formatBrl(bd.discountedRent.discountAmount)}) = ${formatBrl(bd.discountedRent.result)}`;
  const tooltipPlatformFee =
    `${bd.platformAdminFee.feePct}% × ${formatBrl(bd.platformAdminFee.appliedTo)} (aluguel c/ desconto) = ${formatBrl(bd.platformAdminFee.result)}`;
  const tooltipTokens =
    `${charge.tokens.quantity} tokens acordados no contrato`;

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
              {formatBrl(charge.calculatedAmounts.discountedRent)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
              Tokens
            </div>
            <div className="font-sans text-[13px] font-bold text-[#0D1321]">
              {formatBrl(charge.calculatedAmounts.tokenPurchase)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9AA3B0]">
              Total
            </div>
            <div className="font-sans text-[13px] font-bold text-[#0D1321]">
              {formatBrl(charge.calculatedAmounts.gross)}
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
              onClick={() => onToggleExpand(charge.id)}
              className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-white/15 bg-white/7 text-white/60 transition hover:bg-white/14 hover:text-white"
              aria-label="Fechar painel"
            >
              <X size={10} />
            </button>
          </div>

          {/* Editable fields */}
          <div className="bg-white p-5">
            <div className="grid grid-cols-2 gap-4">
              <EditableAmountField
                label="Valor dos Tokens"
                field="tokenPurchase"
                value={draft.tokenPurchase}
                hint={calcDiff(draft.tokenPurchase, charge.amounts.tokenPurchase)}
                tooltip={tooltipTokens}
                tooltipPlacement="left"
                onChange={handleFieldChange}
              />
              <EditableAmountField
                label="Aluguel Mensal"
                field="discountedRent"
                value={draft.discountedRent}
                hint={calcDiff(draft.discountedRent, charge.amounts.discountedRent)}
                tooltip={tooltipDiscountedRent}
                tooltipPlacement="right"
                onChange={handleFieldChange}
              />
              <EditableAmountField
                label="Taxa sobre Aluguel"
                field="platformAdminFee"
                value={draft.platformAdminFee}
                hint={calcDiff(draft.platformAdminFee, charge.amounts.platformAdminFee)}
                tooltip={tooltipPlatformFee}
                tooltipPlacement="left"
                onChange={handleFieldChange}
              />
              <EditableAmountField
                label="Taxa sobre Compra de Tokens"
                field="tokenPurchaseFee"
                value={draft.tokenPurchaseFee}
                hint={calcDiff(draft.tokenPurchaseFee, charge.amounts.tokenPurchaseFee)}
                onChange={handleFieldChange}
              />
              <EditableAmountField
                label="Taxa de Condomínio"
                field="condominiumFee"
                value={draft.condominiumFee}
                hint={calcDiff(draft.condominiumFee, charge.amounts.condominiumFee)}
                onChange={handleFieldChange}
              />
            </div>

            {/* Live total bar */}
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
                  {formatBrl(liveTotalStr)}
                </div>
                {anyDirtyFromCalc ? (
                  <div className="text-[10px] font-semibold text-[#F5C842]">
                    ⚠ valor ajustado manualmente
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
              <button
                type="button"
                onClick={handleRecalculate}
                className="inline-flex items-center gap-1.5 rounded-[8px] border-[1.5px] border-[#E8EAF0] bg-white px-4 py-2 text-[12.5px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321]"
              >
                <RotateCcw size={12} /> Recalcular
              </button>
              <button
                type="button"
                onClick={() => onRequestValidate(charge, draft)}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#F5C842] px-5 py-2 font-sans text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#0D1321] shadow-[0_3px_12px_rgba(245,200,66,0.25)] transition hover:-translate-y-0.5 hover:bg-[#C8A020]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Gerar boleto
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
