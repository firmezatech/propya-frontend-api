/**
 * Tests: token purchase Pix display helpers
 *
 * Scope:
 *   - getPixCopyPasteCode — copyPasteCode → copyPaste → qrCode fallback chain
 *   - getPixQrCodeImageSrc — qrCodeImageUrl / qrCodeImage / raw encodedImage, with base64 prefixing
 *   - getPixExpiration — dueAt → expiresAt fallback
 *   - mergePixIntoPayment — late-arriving pix fields merge without clobbering valid ones
 */

import {
  getPixCopyPasteCode,
  getPixQrCodeImageSrc,
  getPixExpiration,
  mergePixIntoPayment,
} from '../features/tenant-portal/token-purchase/services/fmz-token-purchase-api';
import type { FmzTokenPurchasePayment } from '../features/tenant-portal/token-purchase/domain/fmz-token-purchase.types';

const paymentWithPix = (pix: FmzTokenPurchasePayment['pix']): FmzTokenPurchasePayment => ({
  paymentTransactionId: 'pay-1',
  paymentMethod: 'pix',
  pix,
});

describe('getPixCopyPasteCode', () => {
  it('prefers copyPasteCode', () => {
    expect(getPixCopyPasteCode(paymentWithPix({ copyPasteCode: 'A', copyPaste: 'B', qrCode: 'C' }))).toBe('A');
  });

  it('falls back to copyPaste', () => {
    expect(getPixCopyPasteCode(paymentWithPix({ copyPaste: 'B', qrCode: 'C' }))).toBe('B');
  });

  it('falls back to qrCode', () => {
    expect(getPixCopyPasteCode(paymentWithPix({ qrCode: 'C' }))).toBe('C');
  });

  it('returns empty string when no code is present', () => {
    expect(getPixCopyPasteCode(paymentWithPix({}))).toBe('');
    expect(getPixCopyPasteCode(null)).toBe('');
  });
});

describe('getPixQrCodeImageSrc', () => {
  it('renders a ready data URL from qrCodeImageUrl', () => {
    expect(getPixQrCodeImageSrc(paymentWithPix({ qrCodeImageUrl: 'data:image/png;base64,AAA' })))
      .toBe('data:image/png;base64,AAA');
  });

  it('passes through an http(s) image URL', () => {
    expect(getPixQrCodeImageSrc(paymentWithPix({ qrCodeImageUrl: 'https://asaas/qr.png' })))
      .toBe('https://asaas/qr.png');
  });

  it('prefixes raw base64 from encodedImage', () => {
    expect(getPixQrCodeImageSrc(paymentWithPix({ encodedImage: 'RAWBASE64' })))
      .toBe('data:image/png;base64,RAWBASE64');
  });

  it('prefixes raw base64 from qrCodeImage alias', () => {
    expect(getPixQrCodeImageSrc(paymentWithPix({ qrCodeImage: 'RAWBASE64' })))
      .toBe('data:image/png;base64,RAWBASE64');
  });

  it('returns empty string when no image field is present', () => {
    expect(getPixQrCodeImageSrc(paymentWithPix({}))).toBe('');
    expect(getPixQrCodeImageSrc(null)).toBe('');
  });
});

describe('getPixExpiration', () => {
  it('prefers dueAt then falls back to expiresAt', () => {
    expect(getPixExpiration(paymentWithPix({ dueAt: 'D', expiresAt: 'E' }))).toBe('D');
    expect(getPixExpiration(paymentWithPix({ expiresAt: 'E' }))).toBe('E');
    expect(getPixExpiration(paymentWithPix({}))).toBeNull();
  });
});

describe('mergePixIntoPayment', () => {
  it('fills in pix fields that arrive later via polling', () => {
    const initial = paymentWithPix({ status: 'pending' });
    const merged = mergePixIntoPayment(initial, {
      qrCode: 'PAYLOAD',
      copyPasteCode: 'PAYLOAD',
      qrCodeImageUrl: 'data:image/png;base64,AAA',
      status: 'pending',
    });
    expect(merged?.pix?.qrCode).toBe('PAYLOAD');
    expect(merged?.pix?.copyPasteCode).toBe('PAYLOAD');
    expect(merged?.pix?.qrCodeImageUrl).toBe('data:image/png;base64,AAA');
  });

  it('does not overwrite valid existing fields with null/undefined from a partial response', () => {
    const initial = paymentWithPix({ qrCode: 'EXISTING', qrCodeImageUrl: 'data:image/png;base64,AAA' });
    const merged = mergePixIntoPayment(initial, { qrCode: null, qrCodeImageUrl: undefined, status: 'paid' });
    expect(merged?.pix?.qrCode).toBe('EXISTING');
    expect(merged?.pix?.qrCodeImageUrl).toBe('data:image/png;base64,AAA');
    expect(merged?.pix?.status).toBe('paid');
  });

  it('is a no-op when there is no payment or no incoming pix', () => {
    expect(mergePixIntoPayment(null, { qrCode: 'X' })).toBeNull();
    const payment = paymentWithPix({ qrCode: 'KEEP' });
    expect(mergePixIntoPayment(payment, null)).toBe(payment);
  });
});
