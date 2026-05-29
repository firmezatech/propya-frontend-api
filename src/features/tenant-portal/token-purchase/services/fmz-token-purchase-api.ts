import { authenticatedFirmezaFetch } from '../../../../services/firmeza-api-client';
import type {
  FmzTokenPurchasePayment,
  FmzTokenPurchasePaymentBackendResponse,
  FmzTokenPurchasePaymentMethod,
  FmzTokenPurchaseQuote,
  FmzTokenPurchaseQuoteBackendResponse,
} from '../domain/fmz-token-purchase.types';

// ── Quote ──────────────────────────────────────────────────────────────────────

/**
 * Fetches a server-computed price quote for a prospective token purchase.
 * No DB writes — safe to call on every quantity change (use with debounce).
 *
 * The returned quote contains all monetary values pre-computed server-side.
 * The UI must display these values directly — no client-side price calculations.
 *
 * @throws {Error} if the tokenizationId is missing, the tokenization is
 *                 inactive, or the quantity exceeds available supply.
 */
export async function fetchTokenPurchaseQuote({
  propertyTokenizationId,
  quantity,
  paymentMethod,
}: {
  propertyTokenizationId: string;
  quantity: number;
  paymentMethod: FmzTokenPurchasePaymentMethod;
}): Promise<FmzTokenPurchaseQuote> {
  const params = new URLSearchParams({
    propertyTokenizationId,
    quantity: String(quantity),
    paymentMethod,
  });

  const response = await authenticatedFirmezaFetch(
    `/tenant/token-purchases/quote?${params.toString()}`,
  );

  const body = (await response.json().catch(() => ({}))) as FmzTokenPurchaseQuoteBackendResponse;

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body) ?? `Não foi possível obter a cotação (HTTP ${response.status}).`,
    );
  }

  if (!body.quote) {
    throw new Error('Resposta da cotação inválida — campo quote ausente.');
  }

  return body.quote;
}

// ── Payment ────────────────────────────────────────────────────────────────────

/**
 * Creates a token purchase payment (PIX or Boleto) via the backend.
 * The backend fetches the authoritative token price and processing fee from its
 * own tables — this function intentionally does NOT send any monetary values.
 *
 * On success, returns the payment object with nested `pix` or `boleto` details.
 *
 * @throws {Error} if the backend rejects the request or the Asaas call fails.
 */
export async function createTokenPurchasePayment({
  propertyTokenizationId,
  quantity,
  paymentMethod,
  propertyId,
}: {
  propertyTokenizationId: string;
  quantity: number;
  paymentMethod: FmzTokenPurchasePaymentMethod;
  propertyId?: number | null;
}): Promise<FmzTokenPurchasePayment> {
  const response = await authenticatedFirmezaFetch('/tenant/token-purchases/payments', {
    method: 'POST',
    body: JSON.stringify({
      propertyTokenizationId,
      quantity,
      paymentMethod,
      ...(propertyId != null ? { propertyId } : {}),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as FmzTokenPurchasePaymentBackendResponse;

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body) ?? `Não foi possível criar o pagamento (HTTP ${response.status}).`,
    );
  }

  if (!body.payment) {
    throw new Error('Resposta de pagamento inválida — campo payment ausente.');
  }

  return body.payment;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;

  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown>;
    if (typeof first.message === 'string') return first.message;
  }
  if (errors && typeof errors === 'object') {
    const values = Object.values(errors as Record<string, unknown>);
    const first = values[0];
    if (typeof first === 'string') return first;
  }

  return null;
}

// ── Payment display helpers ────────────────────────────────────────────────────

export function getPixCopyPasteCode(payment: FmzTokenPurchasePayment | null): string {
  return payment?.pix?.copyPasteCode ?? payment?.pix?.qrCode ?? '';
}

export function getPixQrCodeImageSrc(payment: FmzTokenPurchasePayment | null): string | null {
  const raw = payment?.pix?.qrCodeImageUrl ?? null;
  if (!raw) return null;
  if (raw.startsWith('data:image') || raw.startsWith('http')) return raw;
  if (raw.length > 120) return `data:image/png;base64,${raw}`;
  return null;
}

export function getBoletoLinhaDigitavel(payment: FmzTokenPurchasePayment | null): string {
  return payment?.boleto?.linhaDigitavel ?? payment?.boleto?.copyPasteCode ?? '';
}

export function statusIsPaid(status?: string | null): boolean {
  return ['paid', 'received', 'confirmed', 'authorized', 'confirmed_onchain', 'completed'].includes(
    String(status ?? '').toLowerCase(),
  );
}
