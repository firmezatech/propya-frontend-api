import type { FmzTokenPurchaseCart, FmzTokenPurchasePaymentMethod } from './fmz-token-purchase.types';

export const FMZ_TOKEN_PURCHASE_CART_KEY = 'firmeza:tenant-token-purchase-cart';

export const TOKEN_PRICE_BRL = 1;
export const PLATFORM_FEE_RATE = 0.075;
export const MIN_TOKEN_PURCHASE = 1000;
export const MAX_TOKEN_PURCHASE = 50000;
export const TOKEN_PURCHASE_STEP = 1000;

const DEFAULT_CURRENT_TOKENS = 7200;
const DEFAULT_TOTAL_TOKENS = 100000;
const DEFAULT_CURRENT_RENT = 792.62;
const DEFAULT_FULL_RENT = 854;
const DEFAULT_PROPERTY_VALUE = 854000;
const DEFAULT_CURRENT_PERCENTAGE = 7.2;
const MILESTONE_TOKENS = 10000;

export function calculateTokenPurchaseCart({
  tokens,
  method = 'pix',
  propertyId,
  rentChargeId,
  currentTokens = DEFAULT_CURRENT_TOKENS,
  totalTokens = DEFAULT_TOTAL_TOKENS,
  currentRent = DEFAULT_CURRENT_RENT,
  fullRent = DEFAULT_FULL_RENT,
  propertyValue = DEFAULT_PROPERTY_VALUE,
}: {
  tokens: number;
  method?: FmzTokenPurchasePaymentMethod;
  propertyId?: number | null;
  rentChargeId?: string | null;
  currentTokens?: number;
  totalTokens?: number;
  currentRent?: number;
  fullRent?: number;
  propertyValue?: number;
}): FmzTokenPurchaseCart {
  const safeTokens = Math.max(MIN_TOKEN_PURCHASE, Math.min(MAX_TOKEN_PURCHASE, Math.round(tokens / TOKEN_PURCHASE_STEP) * TOKEN_PURCHASE_STEP));
  const subtotal = safeTokens * TOKEN_PRICE_BRL;
  const fee = subtotal * PLATFORM_FEE_RATE;
  const total = subtotal + fee;
  const currentPercentage = totalTokens > 0 ? (currentTokens / totalTokens) * 100 : DEFAULT_CURRENT_PERCENTAGE;
  const newTokens = currentTokens + safeTokens;
  const newPercentage = totalTokens > 0 ? (newTokens / totalTokens) * 100 : currentPercentage;
  const deltaPercentage = Math.max(0, newPercentage - currentPercentage);
  const discountPerPercentagePoint = currentPercentage > 0 ? (fullRent - currentRent) / currentPercentage : 0;
  const newRent = Math.max(0, fullRent - newPercentage * discountPerPercentagePoint);
  const rentSaving = Math.max(0, currentRent - newRent);
  const currentOwnedValue = (currentPercentage / 100) * propertyValue;
  const newOwnedValue = (newPercentage / 100) * propertyValue;
  const toMilestone = Math.max(0, MILESTONE_TOKENS - newTokens);

  return {
    tokens: safeTokens,
    method,
    subtotal,
    fee,
    feeRate: PLATFORM_FEE_RATE,
    total,
    currentTokens,
    totalTokens,
    currentPercentage,
    newPercentage,
    deltaPercentage,
    currentRent,
    newRent,
    rentSaving,
    currentOwnedValue,
    newOwnedValue,
    propertyValue,
    toMilestone,
    createdAt: Date.now(),
    propertyId,
    rentChargeId,
  };
}

export function readTokenPurchaseCart(): FmzTokenPurchaseCart | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(FMZ_TOKEN_PURCHASE_CART_KEY) || window.sessionStorage.getItem('firmeza:cart');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FmzTokenPurchaseCart>;
    if (!parsed.tokens || Number(parsed.tokens) <= 0) return null;

    return {
      ...calculateTokenPurchaseCart({
        tokens: Number(parsed.tokens),
        method: parsed.method === 'boleto' ? 'boleto' : 'pix',
        propertyId: parsed.propertyId ?? null,
        rentChargeId: parsed.rentChargeId ?? null,
        currentTokens: Number(parsed.currentTokens ?? DEFAULT_CURRENT_TOKENS),
        totalTokens: Number(parsed.totalTokens ?? DEFAULT_TOTAL_TOKENS),
        currentRent: Number(parsed.currentRent ?? DEFAULT_CURRENT_RENT),
        propertyValue: Number(parsed.propertyValue ?? DEFAULT_PROPERTY_VALUE),
      }),
      ...parsed,
      tokens: Number(parsed.tokens),
      method: parsed.method === 'boleto' ? 'boleto' : 'pix',
    };
  } catch {
    return null;
  }
}

export function writeTokenPurchaseCart(cart: FmzTokenPurchaseCart): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(FMZ_TOKEN_PURCHASE_CART_KEY, JSON.stringify(cart));
  window.sessionStorage.setItem('firmeza:cart', JSON.stringify(cart));
}
