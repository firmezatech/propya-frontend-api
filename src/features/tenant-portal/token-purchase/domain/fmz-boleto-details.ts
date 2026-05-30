import type {
  FmzTokenPurchasePayment,
  FmzTokenPurchaseStatusResponse,
} from './fmz-token-purchase.types';

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
  /** Preferred copyable code (linha digitável). Falls back to copyPasteCode. */
  linhaDigitavel?: string;
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

function firstFiniteNumber(...values: Array<unknown>): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value.replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
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
    result.amount ??= firstFiniteNumber(payment.totalAmount, status.amount);
    result.currency ??= firstNonEmptyString(status.currency);
    result.status ??= firstNonEmptyString(
      boleto?.status,
      payment.status,
      status.paymentStatus,
    );
    result.dueDate ??= firstNonEmptyString(boleto?.dueAt, payment.dueAt, status.dueAt);
    result.linhaDigitavel ??= firstNonEmptyString(
      boleto?.linhaDigitavel,
      boleto?.copyPasteCode,
      boleto?.barcode,
    );
    result.barcode ??= firstNonEmptyString(boleto?.barcode, boleto?.linhaDigitavel);
    result.nossoNumero ??= firstNonEmptyString(boleto?.nossoNumero);
    result.providerBoletoId ??= firstNonEmptyString(boleto?.providerBoletoId);
    result.pdfUrl ??= firstNonEmptyString(boleto?.pdfUrl, boleto?.downloadUrl);
    result.boletoUrl ??= firstNonEmptyString(boleto?.boletoUrl, boleto?.pdfUrl, boleto?.downloadUrl);
  }

  return result;
}

// ── Status translation ───────────────────────────────────────────────────────

const BOLETO_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  awaiting_payment: 'Aguardando pagamento',
  created: 'Boleto emitido',
  issued: 'Boleto emitido',
  registered: 'Boleto registrado',
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
