import { authenticatedFirmezaFetch } from '../../../../services/firmeza-api-client';
import type { FmzTokenPurchaseBackendResponse, FmzTokenPurchaseCart, FmzTokenPurchasePayment } from '../domain/fmz-token-purchase.types';

const TOKEN_PIX_ENDPOINT = process.env.NEXT_PUBLIC_TENANT_TOKEN_PIX_ENDPOINT || '/tenant/token-purchases/pix';
const TOKEN_PAYMENT_STATUS_ENDPOINT = process.env.NEXT_PUBLIC_TENANT_TOKEN_PAYMENT_STATUS_ENDPOINT || '/tenant/token-purchases';

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function pickNestedRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.payment, record.pix, record.boleto, record.charge, record.paymentDetails];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return { ...record, ...(candidate as Record<string, unknown>) };
    }
  }

  return record;
}

export function normalizeTokenPurchasePayment(payload: unknown): FmzTokenPurchasePayment {
  const record = pickNestedRecord(payload);

  return {
    id: pickString(record, ['id', 'paymentId', 'chargeId']),
    paymentTransactionId: pickString(record, ['paymentTransactionId', 'payment_transaction_id', 'transactionId', 'id']),
    rentChargeId: pickString(record, ['rentChargeId', 'rent_charge_id']),
    status: pickString(record, ['status', 'paymentStatus']),
    paymentProvider: pickString(record, ['paymentProvider', 'provider']),
    externalReference: pickString(record, ['externalReference', 'external_reference']),
    expiresAt: pickString(record, ['expiresAt', 'expirationDate', 'dueAt']),
    dueAt: pickString(record, ['dueAt', 'dueDate']),
    amount: toNumber(record.amount ?? record.value ?? record.totalAmount),
    pixQrCode: pickString(record, ['pixQrCode', 'qrCode', 'pix_qr_code']),
    pixQrCodeImage: pickString(record, ['pixQrCodeImage', 'qrCodeImage', 'encodedImage', 'pix_qr_code_image']),
    pixCopyPaste: pickString(record, ['pixCopyPaste', 'copyPaste', 'copyPasteCode', 'pixPayload', 'payload', 'pix_copy_paste']),
    encodedImage: pickString(record, ['encodedImage', 'qrCodeBase64', 'pixQrCodeBase64']),
    payload: pickString(record, ['payload', 'pixPayload', 'copyPasteCode']),
    invoiceUrl: pickString(record, ['invoiceUrl', 'bankSlipUrl']),
    boletoUrl: pickString(record, ['boletoUrl', 'boleto_url']),
    pdfUrl: pickString(record, ['pdfUrl', 'pdf_url']),
    raw: payload,
  };
}

export async function createTenantTokenPixPayment(cart: FmzTokenPurchaseCart): Promise<FmzTokenPurchasePayment> {
  const endpoint = cart.rentChargeId
    ? `/tenant/rent-charges/${encodeURIComponent(cart.rentChargeId)}/payments`
    : TOKEN_PIX_ENDPOINT;

  const response = await authenticatedFirmezaFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      propertyId: cart.propertyId ?? undefined,
      rentChargeId: cart.rentChargeId ?? undefined,
      tokens: cart.tokens,
      tokenAmount: cart.tokens,
      paymentMethod: 'pix',
      subtotalAmount: cart.subtotal,
      feeAmount: cart.fee,
      feeRate: cart.feeRate,
      totalAmount: cart.total,
    }),
  });

  const responseBody = (await response.json().catch(() => ({}))) as FmzTokenPurchaseBackendResponse;

  if (!response.ok) {
    throw new Error(responseBody.message || 'Não foi possível gerar o PIX no backend.');
  }

  return normalizeTokenPurchasePayment(responseBody);
}

export async function getTenantTokenPaymentStatus(payment: FmzTokenPurchasePayment): Promise<FmzTokenPurchasePayment> {
  const paymentId = payment.paymentTransactionId || payment.id;

  if (payment.rentChargeId) {
    const response = await authenticatedFirmezaFetch(`/tenant/rent-charges/${encodeURIComponent(payment.rentChargeId)}/payments`);
    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('Não foi possível consultar o status do PIX.');
    return normalizeTokenPurchasePayment(responseBody);
  }

  if (!paymentId) return payment;

  const response = await authenticatedFirmezaFetch(`${TOKEN_PAYMENT_STATUS_ENDPOINT}/${encodeURIComponent(paymentId)}/payments`);
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error('Não foi possível consultar o status do PIX.');
  }

  return normalizeTokenPurchasePayment(responseBody);
}
