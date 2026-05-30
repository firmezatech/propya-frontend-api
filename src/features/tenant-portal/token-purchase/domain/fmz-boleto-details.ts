import type {
  FmzTokenPurchasePayment,
  FmzTokenPurchaseStatusResponse,
} from './fmz-token-purchase.types';
import { firstFiniteNumberOrUndefined } from '../../../../lib/fmz-number';

// ── Normalized boleto view-model ─────────────────────────────────────────────
// A single, UI-friendly shape the boleto page renders directly. The backend may
// expose boleto data either at the top level (status endpoint) or nested under
// `boleto` (creation endpoint) — `normalizeBoletoDetails` reconciles both so the
// UI never has to know where a value came from.

export interface BoletoPaymentDetails {
  paymentTransactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  dueDate?: string;
  /**
   * Copyable code shown in the copy field. Resolved from the linha digitável /
   * digitable-line aliases only — NEVER from the barcode (they are different
   * values and the barcode is not a valid linha digitável).
   */
  linhaDigitavel?: string;
  /** Barcode value for the barcode visual area. Kept separate from linhaDigitavel. */
  barcode?: string;
  nossoNumero?: string;
  providerBoletoId?: string;
  /** Best available link to open/download the boleto (PDF preferred). */
  pdfUrl?: string;
  boletoUrl?: string;
}

type BoletoSource =
  | FmzTokenPurchasePayment
  | FmzTokenPurchaseStatusResponse
  | null
  | undefined;

function firstNonEmptyString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

/**
 * Reconciles one or more backend payloads (creation response, status response,
 * a cached payment object) into a single boleto view-model. Earlier sources win
 * per-field, so callers should pass the freshest/most authoritative source first.
 *
 * Tolerant by design: every field is optional and the UI applies safe fallbacks.
 */
export function normalizeBoletoDetails(...sources: BoletoSource[]): BoletoPaymentDetails {
  const result: BoletoPaymentDetails = {};

  for (const source of sources) {
    if (!source) continue;

    const payment = source as Partial<FmzTokenPurchasePayment>;
    const status = source as Partial<FmzTokenPurchaseStatusResponse>;
    const boleto = source.boleto ?? null;

    result.paymentTransactionId ??= firstNonEmptyString(source.paymentTransactionId);
    result.amount ??= firstFiniteNumberOrUndefined(payment.totalAmount, status.amount);
    result.currency ??= firstNonEmptyString(status.currency);
    result.status ??= firstNonEmptyString(
      boleto?.status,
      payment.status,
      status.paymentStatus,
    );
    result.dueDate ??= firstNonEmptyString(boleto?.dueAt, payment.dueAt, status.dueAt);
    // Copyable code (linha digitável) — resolved only from digitable-line aliases.
    // Never falls back to the barcode: they are distinct values.
    result.linhaDigitavel ??= firstNonEmptyString(
      boleto?.linhaDigitavel,
      boleto?.copyPasteCode,
      boleto?.digitableLine,
      boleto?.identificationField,
    );
    // Barcode — resolved only from barcode aliases; never falls back to linha digitável.
    result.barcode ??= firstNonEmptyString(boleto?.barcode, boleto?.barCode);
    result.nossoNumero ??= firstNonEmptyString(boleto?.nossoNumero);
    result.providerBoletoId ??= firstNonEmptyString(boleto?.providerBoletoId);
    result.pdfUrl ??= firstNonEmptyString(boleto?.pdfUrl, boleto?.downloadUrl);
    result.boletoUrl ??= firstNonEmptyString(boleto?.boletoUrl, boleto?.pdfUrl, boleto?.downloadUrl);
  }

  return result;
}

// ── Status translation ───────────────────────────────────────────────────────

const BOLETO_STATUS_LABELS: Record<string, string> = {
  // Pre-payment lifecycle states — all surface as "Aguardando pagamento" so the
  // tenant never sees a raw provider state like "generated" or "registered".
  generated: 'Aguardando pagamento',
  registered: 'Aguardando pagamento',
  sent: 'Aguardando pagamento',
  pending: 'Aguardando pagamento',
  awaiting_payment: 'Aguardando pagamento',
  created: 'Aguardando pagamento',
  issued: 'Aguardando pagamento',
  // Settled / terminal states.
  received: 'Pagamento recebido',
  confirmed: 'Pagamento confirmado',
  paid: 'Pago',
  authorized: 'Pagamento autorizado',
  completed: 'Concluído',
  settlement_pending: 'Compensação em andamento',
  overdue: 'Vencido',
  expired: 'Vencido',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
  failed: 'Falhou',
};

/**
 * Maps a backend boleto/payment status code to a friendly Portuguese label.
 * Unknown statuses fall back to a humanized version of the raw value.
 */
export function translateBoletoStatus(status?: string | null): string {
  if (!status || !status.trim()) return 'Aguardando pagamento';
  const key = status.trim().toLowerCase();
  if (BOLETO_STATUS_LABELS[key]) return BOLETO_STATUS_LABELS[key];
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]+/g, ' ');
}

/** Whether a boleto status represents a settled/paid payment. */
export function boletoStatusIsPaid(status?: string | null): boolean {
  return ['paid', 'received', 'confirmed', 'authorized', 'completed'].includes(
    String(status ?? '').toLowerCase(),
  );
}
