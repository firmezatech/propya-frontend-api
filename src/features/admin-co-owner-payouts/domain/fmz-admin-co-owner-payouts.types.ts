// ─── Source / status enums ──────────────────────────────────────────────────────

export type FmzCoOwnerPayoutSourceType = 'rent_distribution' | 'token_sale';

export type FmzPayoutRequestStatus = 'pending_approval' | 'approved' | 'paid' | 'rejected';

// ─── Row (1 co-owner × 1 evento de origem) ──────────────────────────────────────

export type FmzCoOwnerPayoutProperty = {
  id: string | null;
  tokenizationId: string | null;
  name: string | null;
  neighborhood: string | null;
};

export type FmzCoOwnerPayoutRequestRef = {
  id: string;
  status: FmzPayoutRequestStatus;
};

export type FmzCoOwnerPayoutRow = {
  sourceType: FmzCoOwnerPayoutSourceType;
  sourceReferenceId: string;
  property: FmzCoOwnerPayoutProperty;
  cycleLabel: string | null;
  eventDate: string;
  ownerUserId: string;
  ownerName: string | null;
  tokensBefore: number | null;
  tokensAfter: number | null;
  ownershipPctBefore: string | null;
  ownershipPctAfter: string | null;
  rentShareBrl: string;
  tokenSaleShareBrl: string;
  accruedBalanceBrl: string;
  readyForPayout: boolean;
  payoutRequest: FmzCoOwnerPayoutRequestRef | null;
  /** Inquilina do ciclo (rent_distribution) ou compradora dos tokens (token_sale). */
  tenantName: string | null;
  /** Valor total da cobrança de aluguel do ciclo — null em linhas token_sale. */
  rentTotalBrl: string | null;
  /** Quantidade de tokens vendidos — null em linhas rent_distribution. */
  tokenQuantity: number | null;
  /** Valor unitário do token na venda — null em linhas rent_distribution. */
  tokenUnitValueBrl: string | null;
};

// ─── Summary (KPI strip) ─────────────────────────────────────────────────────────

export type FmzCoOwnerPayoutsSummary = {
  totalPendingBrl: string;
  coOwnersAwaitingCount: number;
  openTransactionsCount: number;
  belowMinimumCount: number;
  belowMinimumTotalBrl: string;
};

export type FmzCoOwnerPayoutsListResponse = {
  rows: FmzCoOwnerPayoutRow[];
  summary: FmzCoOwnerPayoutsSummary;
};

// ─── Filters ──────────────────────────────────────────────────────────────────────

export type FmzCoOwnerPayoutsFilters = {
  competenceMonth: string; // 'YYYY-MM-01', obrigatório na API
  status?: FmzPayoutRequestStatus;
  /** Aceito pela API desde a entrega original (D-3); opções vêm de rows já carregadas (D-12). */
  propertyTokenizationId?: string;
};

// ─── Mutation result shapes ──────────────────────────────────────────────────────

export type FmzApprovePayoutRequestStatus =
  | 'paid'
  | 'not_found'
  | 'not_approvable'
  | 'in_progress'
  | 'no_pix_key';

export type FmzApprovePayoutRequestResult = {
  status: FmzApprovePayoutRequestStatus;
  currentStatus?: string;
  transferId?: string;
};

export type FmzRejectPayoutRequestStatus =
  | 'rejected'
  | 'not_found'
  | 'not_rejectable'
  | 'in_progress';

export type FmzRejectPayoutRequestResult = {
  status: FmzRejectPayoutRequestStatus;
  currentStatus?: string;
};

export type FmzApproveBatchItemResult = {
  id: string;
  status: string;
  error?: string;
};
