import { authenticatedFirmezaFetch } from '../../../../services/firmeza-api-client';
import type {
  FmzTokenPurchaseContext,
  FmzTokenPurchaseContextBackendResponse,
  FmzTokenPurchasePayment,
  FmzTokenPurchasePaymentBackendResponse,
  FmzTokenPurchasePaymentMethod,
  FmzTokenPurchasePaymentPix,
  FmzTokenPurchaseQuote,
  FmzTokenPurchaseQuoteBackendResponse,
  FmzTokenPurchaseStatusResponse,
} from '../domain/fmz-token-purchase.types';

// ── Quote ──────────────────────────────────────────────────────────────────────

/**
 * Fetches quantity-independent context for the token purchase page.
 * Cached 30s server-side per (user, tokenization). Safe to call once on mount.
 */
export async function fetchTokenPurchaseQuoteContext({
  propertyTokenizationId,
}: {
  propertyTokenizationId: string;
}): Promise<FmzTokenPurchaseContext> {
  const params = new URLSearchParams({ propertyTokenizationId });
  const response = await authenticatedFirmezaFetch(
    `/tenant/token-purchases/quote/context?${params.toString()}`,
  );
  const body = (await response.json().catch(() => ({}))) as FmzTokenPurchaseContextBackendResponse;
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body) ?? `Não foi possível carregar o contexto (HTTP ${response.status}).`,
    );
  }
  if (!body.context) {
    throw new Error('Resposta do contexto inválida — campo context ausente.');
  }
  return body.context;
}

/**
 * Fetches a server-computed price quote for a prospective token purchase.
 * No DB writes — safe to call on every quantity change (use with debounce).
 * PIX and Boleto have the same fee, so paymentMethod is not required.
 */
export async function fetchTokenPurchaseQuote({
  propertyTokenizationId,
  quantity,
}: {
  propertyTokenizationId: string;
  quantity: number;
}): Promise<FmzTokenPurchaseQuote> {
  const params = new URLSearchParams({
    propertyTokenizationId,
    quantity: String(quantity),
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
  idempotencyKey,
  propertyId,
}: {
  propertyTokenizationId: string;
  quantity: number;
  paymentMethod: FmzTokenPurchasePaymentMethod;
  idempotencyKey: string;
  propertyId?: string | null;
}): Promise<FmzTokenPurchasePayment> {
  const response = await authenticatedFirmezaFetch('/tenant/token-purchases/payments', {
    method: 'POST',
    body: JSON.stringify({
      propertyTokenizationId,
      quantity,
      paymentMethod,
      idempotencyKey,
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

// ── Payment status polling ─────────────────────────────────────────────────────

export async function fetchTokenPurchaseStatus(
  paymentTransactionId: string,
  signal?: AbortSignal,
): Promise<FmzTokenPurchaseStatusResponse> {
  const response = await authenticatedFirmezaFetch(
    `/tenant/token-purchases/payments/${encodeURIComponent(paymentTransactionId)}`,
    { signal },
  );
  return (await response.json().catch(() => ({ success: false }))) as FmzTokenPurchaseStatusResponse;
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
  return (
    payment?.pix?.copyPasteCode ??
    payment?.pix?.copyPaste ??
    payment?.pix?.qrCode ??
    ''
  );
}

export function getPixQrCodeImageSrc(payment: FmzTokenPurchasePayment | null): string {
  const image =
    payment?.pix?.qrCodeImageUrl ??
    payment?.pix?.qrCodeImage ??
    payment?.pix?.encodedImage ??
    '';

  if (!image) return '';
  if (image.startsWith('data:image/')) return image;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `data:image/png;base64,${image}`;
}

export function getPixExpiration(payment: FmzTokenPurchasePayment | null): string | null {
  return payment?.pix?.dueAt ?? payment?.pix?.expiresAt ?? null;
}

// Merges newly-polled pix fields into the current payment without overwriting
// already-populated values with null/undefined from a partial later response.
export function mergePixIntoPayment(
  payment: FmzTokenPurchasePayment | null,
  incomingPix: FmzTokenPurchasePaymentPix | null | undefined,
): FmzTokenPurchasePayment | null {
  if (!payment) return payment;
  if (!incomingPix) return payment;

  const currentPix = payment.pix ?? {};
  const mergedPix: FmzTokenPurchasePaymentPix = { ...currentPix };

  (Object.keys(incomingPix) as Array<keyof FmzTokenPurchasePaymentPix>).forEach((key) => {
    const value = incomingPix[key];
    if (value !== null && value !== undefined) {
      mergedPix[key] = value;
    }
  });

  return { ...payment, pix: mergedPix };
}

export function getBoletoLinhaDigitavel(payment: FmzTokenPurchasePayment | null): string {
  return payment?.boleto?.linhaDigitavel ?? payment?.boleto?.copyPasteCode ?? '';
}

export function statusIsPaid(status?: string | null): boolean {
  return ['paid', 'received', 'confirmed', 'authorized', 'confirmed_onchain', 'completed'].includes(
    String(status ?? '').toLowerCase(),
  );
}
