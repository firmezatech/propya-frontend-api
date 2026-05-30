/**
 * Tests: token purchase Boleto details mapper + helpers
 *
 * Scope:
 *   - normalizeBoletoDetails — reconciles creation response (nested `boleto`) and
 *     status response (top-level amount/status), first source wins per-field
 *   - translateBoletoStatus — friendly Portuguese labels + humanized fallback
 *   - boletoStatusIsPaid — settled/paid status detection
 *   - formatCurrencyBRL / formatDateBR — formatting + safe fallbacks
 */

import {
  normalizeBoletoDetails,
  translateBoletoStatus,
  boletoStatusIsPaid,
} from '../features/tenant-portal/token-purchase/domain/fmz-boleto-details';
import type {
  FmzTokenPurchasePayment,
  FmzTokenPurchaseStatusResponse,
} from '../features/tenant-portal/token-purchase/domain/fmz-token-purchase.types';
import { formatCurrencyBRL } from '../lib/fmz-currency';
import { formatDateBR } from '../lib/fmz-date';

describe('normalizeBoletoDetails', () => {
  it('maps a creation response with nested boleto data', () => {
    const payment: FmzTokenPurchasePayment = {
      paymentTransactionId: 'pay-1',
      paymentMethod: 'boleto',
      totalAmount: 5375,
      status: 'pending',
      dueAt: '2026-05-31',
      boleto: {
        linhaDigitavel: '34191.79001 01043.510047 91020.150008 5 95620000537500',
        barcode: '34195956200005375001790010435100479102015000',
        nossoNumero: '000010435100479102015000',
        providerBoletoId: 'pay_boleto_123',
        pdfUrl: 'https://asaas.com/boleto.pdf',
        boletoUrl: 'https://asaas.com/i/abc',
        dueAt: '2026-05-31',
        status: 'pending',
      },
    };

    const details = normalizeBoletoDetails(payment);
    expect(details.paymentTransactionId).toBe('pay-1');
    expect(details.amount).toBe(5375);
    expect(details.linhaDigitavel).toContain('34191.79001');
    expect(details.barcode).toBe('34195956200005375001790010435100479102015000');
    expect(details.nossoNumero).toBe('000010435100479102015000');
    expect(details.providerBoletoId).toBe('pay_boleto_123');
    expect(details.pdfUrl).toBe('https://asaas.com/boleto.pdf');
    expect(details.dueDate).toBe('2026-05-31');
  });

  it('reads amount/currency/status from a top-level status response', () => {
    const status: FmzTokenPurchaseStatusResponse = {
      success: true,
      paymentTransactionId: 'pay-2',
      paymentStatus: 'received',
      amount: 1200.5,
      currency: 'BRL',
      dueAt: '2026-06-10',
      boleto: { linhaDigitavel: '00000.00000' },
    };

    const details = normalizeBoletoDetails(status);
    expect(details.amount).toBe(1200.5);
    expect(details.currency).toBe('BRL');
    expect(details.status).toBe('received');
    expect(details.dueDate).toBe('2026-06-10');
  });

  it('lets the first source win per field, with later sources filling gaps', () => {
    const fresh: FmzTokenPurchaseStatusResponse = {
      success: true,
      paymentTransactionId: 'pay-3',
      paymentStatus: 'pending',
      amount: 999,
      // status endpoint did not return boleto codes this time
    };
    const seed: FmzTokenPurchasePayment = {
      paymentTransactionId: 'pay-3',
      totalAmount: 111,
      boleto: { linhaDigitavel: 'SEEDED-LINE', pdfUrl: 'https://asaas.com/x.pdf' },
    };

    const details = normalizeBoletoDetails(fresh, seed);
    expect(details.amount).toBe(999); // fresh wins
    expect(details.linhaDigitavel).toBe('SEEDED-LINE'); // seed fills the gap
    expect(details.pdfUrl).toBe('https://asaas.com/x.pdf');
  });

  it('ignores null/undefined sources and returns an empty object when nothing usable', () => {
    expect(normalizeBoletoDetails(null, undefined)).toEqual({});
  });
});

describe('translateBoletoStatus', () => {
  it('maps known statuses to Portuguese labels', () => {
    expect(translateBoletoStatus('pending')).toBe('Aguardando pagamento');
    expect(translateBoletoStatus('PAID')).toBe('Pago');
    expect(translateBoletoStatus('received')).toBe('Pagamento recebido');
    expect(translateBoletoStatus('overdue')).toBe('Vencido');
  });

  it('humanizes unknown statuses and defaults when empty', () => {
    expect(translateBoletoStatus('weird_state')).toBe('Weird state');
    expect(translateBoletoStatus('')).toBe('Aguardando pagamento');
    expect(translateBoletoStatus(null)).toBe('Aguardando pagamento');
  });
});

describe('boletoStatusIsPaid', () => {
  it('detects settled statuses', () => {
    expect(boletoStatusIsPaid('paid')).toBe(true);
    expect(boletoStatusIsPaid('RECEIVED')).toBe(true);
    expect(boletoStatusIsPaid('pending')).toBe(false);
    expect(boletoStatusIsPaid(null)).toBe(false);
  });
});

describe('formatCurrencyBRL', () => {
  it('formats numbers and numeric strings as BRL', () => {
    expect(formatCurrencyBRL(5375)).toBe('R$ 5.375,00');
    expect(formatCurrencyBRL('5375.5')).toBe('R$ 5.375,50');
  });

  it('falls back for non-numeric / empty input', () => {
    expect(formatCurrencyBRL(null)).toBe('—');
    expect(formatCurrencyBRL(undefined)).toBe('—');
    expect(formatCurrencyBRL('abc')).toBe('—');
  });
});

describe('formatDateBR (boleto due date)', () => {
  it('formats ISO date-only without UTC day shift', () => {
    expect(formatDateBR('2026-05-31')).toBe('31/05/2026');
  });

  it('falls back for missing values', () => {
    expect(formatDateBR(null)).toBe('—');
  });
});
