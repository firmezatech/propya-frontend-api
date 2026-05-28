export type FmzTokenPurchasePaymentMethod = 'pix' | 'boleto';

export interface FmzTokenPurchaseCart {
  tokens: number;
  method: FmzTokenPurchasePaymentMethod;
  subtotal: number;
  fee: number;
  feeRate: number;
  total: number;
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
  createdAt: number;
  propertyId?: number | null;
  rentChargeId?: string | null;
}

export interface FmzTokenPurchasePayment {
  id?: string | null;
  paymentTransactionId?: string | null;
  rentChargeId?: string | null;
  status?: string | null;
  paymentProvider?: string | null;
  externalReference?: string | null;
  expiresAt?: string | null;
  dueAt?: string | null;
  amount?: number | null;
  pixQrCode?: string | null;
  pixQrCodeImage?: string | null;
  pixCopyPaste?: string | null;
  encodedImage?: string | null;
  payload?: string | null;
  invoiceUrl?: string | null;
  boletoUrl?: string | null;
  pdfUrl?: string | null;
  raw?: unknown;
}

export interface FmzTokenPurchaseBackendResponse {
  success?: boolean;
  data?: unknown;
  payment?: unknown;
  pix?: unknown;
  boleto?: unknown;
  message?: string;
}
