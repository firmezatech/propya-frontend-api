'use client';

import { useCallback, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { fmzCn } from '../../../lib/fmz-classnames';
import { FmzAdminListSkeleton } from '../../../components/layout';
import { FmzFormAlert } from '../../api-errors/components';
import { useFmzAdminRentCharges } from '../hooks/fmz-admin-rent-charges';
import { FmzAdminRentChargeSummary } from './FmzAdminRentChargeSummary';
import { FmzAdminRentChargeRow } from './FmzAdminRentChargeRow';
import type {
  FmzAdminRentCharge,
  FmzAdminRentChargeFilters,
  FmzRentChargeEditableValues,
  FmzRentChargeStatus,
} from '../domain';

// ─── Types ────────────────────────────────────────────────────────────────────

type Toast = { message: string; ok: boolean } | null;

type PendingValidate = {
  charge: FmzAdminRentCharge;
  draft: FmzRentChargeEditableValues;
} | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: FmzRentChargeStatus | ''; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'pending_validation', label: 'Aguardando revisão' },
  { value: 'open', label: 'Em aberto' },
  { value: 'paid', label: 'Pago' },
];

const TOAST_DURATION_MS = 2800;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCompetenceMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
  );
  for (let offset = 0; offset <= 5; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}-01`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

const COMPETENCE_MONTH_OPTIONS = buildCompetenceMonthOptions();

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseBrl(value: string): number {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}
function formatBrl(value: string): string {
  return brlFormatter.format(parseBrl(value));
}

function parseNum(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Returns true when any draft field differs from the current server amounts by more than R$0.005. */
function isDirtyFromServer(draft: FmzRentChargeEditableValues, charge: FmzAdminRentCharge): boolean {
  const src = charge.calculatedAmounts;
  return (
    Math.abs(parseNum(draft.tokenPurchase) - parseNum(src.tokenPurchase)) > 0.005 ||
    Math.abs(parseNum(draft.discountedRent) - parseNum(src.discountedRent)) > 0.005 ||
    Math.abs(parseNum(draft.platformAdminFee) - parseNum(src.platformAdminFee)) > 0.005 ||
    Math.abs(parseNum(draft.tokenPurchaseFee) - parseNum(src.tokenPurchaseFee)) > 0.005
  );
}

function draftGross(draft: FmzRentChargeEditableValues): string {
  return (
    parseNum(draft.tokenPurchase) +
    parseNum(draft.discountedRent) +
    parseNum(draft.platformAdminFee) +
    parseNum(draft.tokenPurchaseFee)
  ).toFixed(2);
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

type ConfirmModalProps = {
  pending: PendingValidate;
  validating: boolean;
  adjusting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmValidateModal({ pending, validating, adjusting, onConfirm, onCancel }: ConfirmModalProps) {
  if (!pending) return null;
  const { charge, draft } = pending;
  const busy = validating || adjusting;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0D1321]/45 p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(13,19,33,0.22)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EAF0] px-6 py-5">
          <h2 id="confirm-modal-title" className="font-sans text-[16px] font-bold text-[#0D1321]">
            Confirmar geração de boleto
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border-[1.5px] border-[#E8EAF0] text-[#9AA3B0] transition hover:bg-[#F7F8FA] hover:text-[#0D1321]"
            aria-label="Cancelar"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body — shows draft values (D-13) */}
        <div className="px-6 py-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#F0FAF5] mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#1A8C5B" strokeWidth="1.8" />
              <path d="M3 9h18" stroke="#1A8C5B" strokeWidth="1.6" />
              <path d="M8 14h8" stroke="#1A8C5B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mb-1 text-center font-sans text-[15px] font-bold text-[#0D1321]">
            Gerar boleto para {charge.tenant.name}
          </p>
          <p className="mb-4 text-center text-[12.5px] leading-6 text-[#5A6478]">
            {charge.property.address} · {charge.property.neighborhood}
          </p>

          <div className="rounded-[10px] border-[1.5px] border-[#E8EAF0] bg-[#F7F8FA] px-4 py-3">
            {(
              [
                { label: 'Tokens adquiridos', value: formatBrl(draft.tokenPurchase) },
                { label: 'Aluguel mensal', value: formatBrl(draft.discountedRent) },
                { label: 'Taxa sobre aluguel', value: formatBrl(draft.platformAdminFee) },
                { label: 'Taxa compra tokens', value: formatBrl(draft.tokenPurchaseFee) },
              ] as const
            ).map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-[#E8EAF0] py-2 text-[12.5px] last:border-none"
              >
                <span className="text-[#5A6478]">{label}</span>
                <span className="font-semibold text-[#0D1321]">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-[13px]">
              <span className="font-bold text-[#0D1321]">Total a pagar</span>
              <span className="font-sans text-[15px] font-bold text-[#0D1321]">
                {formatBrl(draftGross(draft))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E8EAF0] bg-[#F7F8FA] px-6 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white px-5 py-2.5 text-[13px] font-medium text-[#5A6478] transition hover:border-[#0D1321] hover:text-[#0D1321] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#F5C842] px-5 py-2.5 font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-[#0D1321] shadow-[0_3px_12px_rgba(245,200,66,0.25)] transition hover:-translate-y-0.5 hover:bg-[#C8A020] disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Gerar boleto
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzAdminRentChargesList() {
  const hook = useFmzAdminRentCharges();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingValidate, setPendingValidate] = useState<PendingValidate>(null);
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((previous) => (previous === id ? null : id));
  }, []);

  const handleCompetenceMonthChange = useCallback(
    (value: string) => {
      hook.setFilter({ competenceMonth: value } satisfies Partial<FmzAdminRentChargeFilters>);
      setExpandedId(null);
    },
    [hook],
  );

  const handleStatusChange = useCallback(
    (value: FmzRentChargeStatus | '') => {
      hook.setFilter({ status: value } satisfies Partial<FmzAdminRentChargeFilters>);
      setExpandedId(null);
    },
    [hook],
  );

  // D-13: onRequestValidate receives charge + current draft from the row.
  const handleRequestValidate = useCallback(
    (charge: FmzAdminRentCharge, draft: FmzRentChargeEditableValues) => {
      setPendingValidate({ charge, draft });
    },
    [],
  );

  // D-13: adjust (if dirty) then validate in a single confirm action.
  const handleConfirmValidate = useCallback(async () => {
    if (!pendingValidate) return;
    const { charge, draft } = pendingValidate;

    if (isDirtyFromServer(draft, charge)) {
      const adjusted = await hook.adjustCharge(charge.id, {
        tokenPurchaseAmount: draft.tokenPurchase,
        discountedRentAmount: draft.discountedRent,
        platformAdminFeeAmount: draft.platformAdminFee,
        tokenPurchaseFeeAmount: draft.tokenPurchaseFee,
        reason: 'Ajuste manual pelo admin',
      });
      if (!adjusted) {
        setPendingValidate(null);
        notify('Não foi possível salvar o ajuste.', false);
        return;
      }
    }

    const ok = await hook.validateCharge(charge.id);
    setPendingValidate(null);
    if (ok) {
      setExpandedId(null);
      notify(`Boleto de ${charge.tenant.name} gerado e enviado! ✓`);
    } else {
      notify('Não foi possível gerar o boleto.', false);
    }
  }, [hook, pendingValidate, notify]);

  const handleCancelValidate = useCallback(() => {
    setPendingValidate(null);
  }, []);

  return (
    <section className="min-h-[calc(100vh-124px)] text-[#0D1321]">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9AA3B0]">
            Financeiro
          </div>
          <h1 className="font-sans text-[26px] font-extrabold tracking-[-0.025em] text-[#0D1321]">
            Boletos de Aluguel
          </h1>
          <p className="mt-1 text-[13px] leading-6 text-[#5A6478]">
            Revise e valide os valores calculados antes de gerar cada boleto.
          </p>
        </div>
      </div>

      {/* API errors */}
      {hook.listError ? (
        <div className="mb-5">
          <FmzFormAlert error={hook.listError} />
        </div>
      ) : null}
      {hook.validateError ? (
        <div className="mb-5">
          <FmzFormAlert error={hook.validateError} />
        </div>
      ) : null}

      {/* Summary strip */}
      <FmzAdminRentChargeSummary summary={hook.summary} />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <select
            value={hook.filters.competenceMonth}
            onChange={(e) => handleCompetenceMonthChange(e.target.value)}
            className="appearance-none rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white py-2.5 pl-3.5 pr-9 text-[13px] font-medium text-[#0D1321] outline-none transition focus:border-[#F5C842]"
          >
            {COMPETENCE_MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B0]"
          />
        </div>

        <div className="relative">
          <select
            value={hook.filters.status ?? ''}
            onChange={(e) => handleStatusChange(e.target.value as FmzRentChargeStatus | '')}
            className="appearance-none rounded-[9px] border-[1.5px] border-[#E8EAF0] bg-white py-2.5 pl-3.5 pr-9 text-[13px] text-[#5A6478] outline-none transition focus:border-[#F5C842]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B0]"
          />
        </div>

        {hook.listLoading ? (
          <Loader2 size={16} className="animate-spin text-[#9AA3B0]" />
        ) : null}
      </div>

      {/* List */}
      {hook.listLoading ? (
        <FmzAdminListSkeleton />
      ) : hook.charges.length ? (
        <div className="flex flex-col gap-2.5">
          {hook.charges.map((charge) => (
            <FmzAdminRentChargeRow
              key={charge.id}
              charge={charge}
              isExpanded={expandedId === charge.id}
              onToggleExpand={handleToggleExpand}
              onRequestValidate={handleRequestValidate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-[1.5px] border-[#E8EAF0] bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#E8EAF0] bg-[#F7F8FA]">
            <FileText size={24} className="text-[#D0D4DE]" />
          </div>
          <h3 className="mb-1.5 font-sans text-base font-bold text-[#0D1321]">
            Nenhum boleto encontrado
          </h3>
          <p className="mx-auto max-w-[300px] text-[13px] leading-6 text-[#5A6478]">
            Não há cobranças para os filtros selecionados.
          </p>
        </div>
      )}

      {/* Adjust error alert */}
      {hook.adjustError ? (
        <div className="mt-4 flex items-center gap-2 rounded-[9px] border border-[#F5C4BF] bg-[#FEF5F4] px-4 py-3 text-[13px] text-[#D94F3D]">
          <AlertTriangle size={15} className="flex-shrink-0" />
          {hook.adjustError.description}
        </div>
      ) : null}

      {/* Confirm modal */}
      <ConfirmValidateModal
        pending={pendingValidate}
        validating={hook.validating}
        adjusting={hook.adjusting}
        onConfirm={() => void handleConfirmValidate()}
        onCancel={handleCancelValidate}
      />

      {/* Toast */}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[400] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0D1321] px-[18px] py-[11px] text-[13px] font-medium text-white shadow-lg">
          <span
            className={fmzCn(
              'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full',
              toast.ok ? 'bg-[#F5C842]' : 'bg-[#D94F3D]',
            )}
          >
            <Check size={10} className="text-[#0D1321]" />
          </span>
          {toast.message}
        </div>
      ) : null}
    </section>
  );
}
