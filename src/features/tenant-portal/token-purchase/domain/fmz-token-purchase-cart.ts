import type {
  FmzTokenPurchaseCart,
  FmzTokenPurchasePaymentMethod,
  FmzTokenPurchaseQuote,
} from './fmz-token-purchase.types';

export const FMZ_TOKEN_PURCHASE_CART_KEY = 'firmeza:tenant-token-purchase-cart';

// ── Impact projection helpers ──────────────────────────────────────────────────
// These calculate display-only projections (ownership %, rent savings, etc.)
// from dashboard context data. They are NEVER used for monetary values — all
// amounts come from the server quote.

const MILESTONE_TOKENS = 10000;

export function calculateImpactProjection({
  currentTokens,
  purchaseQuantity,
  totalTokens,
  currentRent,
  fullRent,
  propertyValue,
}: {
  currentTokens: number;
  purchaseQuantity: number;
  totalTokens: number;
  currentRent: number;
  fullRent: number;
  propertyValue: number;
}) {
  const currentPercentage  = totalTokens > 0 ? (currentTokens / totalTokens) * 100 : 0;
  const newTokens          = currentTokens + purchaseQuantity;
  const newPercentage      = totalTokens > 0 ? (newTokens / totalTokens) * 100 : currentPercentage;
  const deltaPercentage    = Math.max(0, newPercentage - currentPercentage);
  const discountPerPoint   = currentPercentage > 0 ? (fullRent - currentRent) / currentPercentage : 0;
  const newRent            = Math.max(0, fullRent - newPercentage * discountPerPoint);
  const rentSaving         = Math.max(0, currentRent - newRent);
  const currentOwnedValue  = (currentPercentage / 100) * propertyValue;
  const newOwnedValue      = (newPercentage / 100) * propertyValue;
  const toMilestone        = Math.max(0, MILESTONE_TOKENS - newTokens);

  return {
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
  };
}

// ── Cart builder ───────────────────────────────────────────────────────────────

export function buildTokenPurchaseCart({
  quote,
  method,
  propertyId,
  currentTokens,
  totalTokens,
  currentRent,
  fullRent,
  propertyValue,
}: {
  quote: FmzTokenPurchaseQuote;
  method: FmzTokenPurchasePaymentMethod;
  propertyId?: number | null;
  currentTokens?: number;
  totalTokens?: number;
  currentRent?: number;
  fullRent?: number;
  propertyValue?: number;
}): FmzTokenPurchaseCart {
  const impact = calculateImpactProjection({
    currentTokens:  currentTokens  ?? 0,
    purchaseQuantity: quote.quantity,
    totalTokens:    totalTokens    ?? quote.availableSupply,
    currentRent:    currentRent    ?? 0,
    fullRent:       fullRent       ?? 0,
    propertyValue:  propertyValue  ?? 0,
  });

  return {
    propertyTokenizationId: quote.propertyTokenizationId,
    quantity:  quote.quantity,
    method,
    quote,
    ...impact,
    createdAt: Date.now(),
    propertyId: propertyId ?? null,
  };
}

// ── Session storage ────────────────────────────────────────────────────────────

export function readTokenPurchaseCart(): FmzTokenPurchaseCart | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(FMZ_TOKEN_PURCHASE_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FmzTokenPurchaseCart>;
    // Guard: a valid cart must always have a server-computed quote.
    if (!parsed.quote || !parsed.propertyTokenizationId || !parsed.quantity) return null;
    return parsed as FmzTokenPurchaseCart;
  } catch {
    return null;
  }
}

export function writeTokenPurchaseCart(cart: FmzTokenPurchaseCart): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(FMZ_TOKEN_PURCHASE_CART_KEY, JSON.stringify(cart));
}

export function clearTokenPurchaseCart(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(FMZ_TOKEN_PURCHASE_CART_KEY);
}
