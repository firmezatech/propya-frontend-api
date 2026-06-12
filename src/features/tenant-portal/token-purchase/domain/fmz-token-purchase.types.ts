export type FmzTokenPurchasePaymentMethod = 'pix' | 'boleto';

// ── Quote context ──────────────────────────────────────────────────────────────
// Returned by GET /tenant/token-purchases/quote/context.
// Quantity-independent — safe to fetch once on page load and cache for 30s.

export interface FmzTokenPurchaseGoal {
  id: string;
  goalKey: string;
  title: string;
  description: string | null;
  rewardDescription: string | null;
  targetPercentage: number;
  targetTokenAmount: number;
  displayOrder: number;
}

export interface FmzTokenPurchaseContextRentProjection {
  currentTokenBalance: number;
  ownershipBps: number;
  currentOwnershipPercentage: number;
  baseRentAmount: number;
  adjustedBaseRentAmount: number;
  currentRentAmount: number;
}

export interface FmzTokenPurchaseContext {
  propertyTokenizationId: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  currency: string;
  unitPrice: number;
  processingFeePercent: number;
  totalSupply: number;
  availableSupply: number;
  minQuantity: number;
  maxQuantity: number;
  rentProjectionInputs: FmzTokenPurchaseContextRentProjection | null;
  goals: FmzTokenPurchaseGoal[];
  issuedAt: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface FmzTokenPurchaseContextBackendResponse {
  success?: boolean;
  context?: FmzTokenPurchaseContext;
  message?: string;
  errors?: unknown;
}

// ── Rent impact ──────────────────────────────────────────────────────────────────
// Optional projection returned by GET /tenant/token-purchases/quote describing how
// the requested purchase changes the tenant's ownership and monthly rent. All values
// are backend-authoritative; the UI prefers these over dashboard-derived estimates.

export interface FmzTokenPurchaseRentImpact {
  currentRentAmount: number;
  projectedRentAmount: number;
  monthlySavingsAmount: number;
  currentOwnershipPercentage: number;
  projectedOwnershipPercentage: number;
  deltaOwnershipPercentage: number;
  currentTokenBalance: number;
  projectedTokenBalance: number;
  totalSupply: number;
  baseRentAmount: number;
  adjustedBaseRentAmount: number;
}

// ── Quote ──────────────────────────────────────────────────────────────────────
// Returned by GET /tenant/token-purchases/quote.
// All monetary values are pre-computed server-side — the UI renders them directly.

export interface FmzTokenPurchaseQuote {
  propertyTokenizationId: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  currency: string;
  availableSupply: number;
  minQuantity: number;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  processingFeePercent: number;
  processingFeeAmount: number;
  total: number;
  /** Ready-to-render price breakdown lines. The UI maps over this array. */
  breakdown: Array<{ label: string; amount: number }>;
  issuedAt: string;
  expiresAt: string;
  expiresInSeconds: number;
  /** Optional backend-computed rent/ownership projection for this quantity. */
  rentImpact?: FmzTokenPurchaseRentImpact | null;
}

// ── Cart ───────────────────────────────────────────────────────────────────────
// Persisted to sessionStorage between the three purchase steps.
// Financial values come exclusively from `quote` — the cart must never
// re-calculate prices client-side.

export interface FmzTokenPurchaseCart {
  propertyTokenizationId: string;
  quantity: number;
  method: FmzTokenPurchasePaymentMethod;
  /** Server-computed quote. All amounts displayed in the UI originate here. */
  quote: FmzTokenPurchaseQuote;
  // Impact projections — computed client-side from dashboard data for display only.
  currentTokens: number;
  totalTokens: number;
  currentPercentage: number;
  newPercentage: number;
  deltaPercentage: number;
  currentRent: number;
  newRent: number;
  rentSaving: number;
  currentOwnedValue: number;
  newOwnedValue: number;
  propertyValue: number;
  toMilestone: number;
  idempotencyKey: string;
  createdAt: number;
  propertyId?: string | null;
}

// ── Payment ────────────────────────────────────────────────────────────────────
// Returned by POST /tenant/token-purchases/payments.
// Matches the backend `formatTokenPurchasePaymentResponse` shape.

export interface FmzTokenPurchasePaymentPix {
  txid?: string | null;
  qrCode?: string | null;
  copyPasteCode?: string | null;
  copyPaste?: string | null;
  qrCodeImageUrl?: string | null;
  qrCodeImage?: string | null;
  encodedImage?: string | null;
  dueAt?: string | null;
  expiresAt?: string | null;
  status?: string | null;
}

export interface FmzTokenPurchasePaymentBoleto {
  providerBoletoId?: string | null;
  nossoNumero?: string | null;
  // Linha digitável / copyable code — backend & provider expose several aliases.
  linhaDigitavel?: string | null;
  digitableLine?: string | null;
  identificationField?: string | null;
  copyPasteCode?: string | null;
  // Barcode — kept strictly separate from the linha digitável.
  barcode?: string | null;
  barCode?: string | null;
  boletoUrl?: string | null;
  pdfUrl?: string | null;
  downloadUrl?: string | null;
  dueAt?: string | null;
  status?: string | null;
}

export interface FmzTokenPurchasePayment {
  tokenOrderId?: string | null;
  paymentTransactionId?: string | null;
  status?: string | null;
  paymentProvider?: string | null;
  paymentMethod?: string | null;
  externalReference?: string | null;
  dueAt?: string | null;
  totalAmount?: number | null;
  pix?: FmzTokenPurchasePaymentPix | null;
  boleto?: FmzTokenPurchasePaymentBoleto | null;
  raw?: unknown;
}

// ── Payment status (polling) ───────────────────────────────────────────────────

export interface FmzTokenPurchaseStatusResponse {
  success: boolean;
  paymentTransactionId?: string | null;
  paymentStatus?: string | null;
  tokenOrderStatus?: string | null;
  paymentMethod?: string | null;
  amount?: number | null;
  currency?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  // Same shapes as the creation response so polling and creation stay interchangeable.
  pix?: FmzTokenPurchasePaymentPix | null;
  boleto?: FmzTokenPurchasePaymentBoleto | null;
}

// ── Backend response envelope ──────────────────────────────────────────────────

export interface FmzTokenPurchaseQuoteBackendResponse {
  success?: boolean;
  quote?: FmzTokenPurchaseQuote;
  message?: string;
  errors?: unknown;
}

export interface FmzTokenPurchasePaymentBackendResponse {
  success?: boolean;
  payment?: FmzTokenPurchasePayment;
  message?: string;
  errors?: unknown;
}
