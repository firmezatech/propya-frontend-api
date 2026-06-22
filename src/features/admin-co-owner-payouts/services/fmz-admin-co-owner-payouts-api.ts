import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzApproveBatchItemResult,
  FmzApprovePayoutRequestResult,
  FmzCoOwnerPayoutRow,
  FmzCoOwnerPayoutsFilters,
  FmzCoOwnerPayoutsListResponse,
  FmzCoOwnerPayoutsSummary,
  FmzPayoutRequestStatus,
  FmzRejectPayoutRequestResult,
} from '../domain';

const ADMIN_CO_OWNER_PAYOUTS_PATH =
  process.env.NEXT_PUBLIC_FMZ_ADMIN_CO_OWNER_PAYOUTS_PATH || '/admin/co-owner-payouts';

const PAYOUT_REQUESTS_PATH =
  process.env.NEXT_PUBLIC_FMZ_PAYOUT_REQUESTS_PATH || '/admin/payout-requests';

// ─── Primitive coercions (mesmo padrão de admin-rent-charges-api.ts) ────────────

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const strOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const numOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const bool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
  return fallback;
};

const arr = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// ─── Sub-object normalizers ───────────────────────────────────────────────────

const normalizeProperty = (value: unknown): FmzCoOwnerPayoutRow['property'] => {
  const r = recordOf(value);
  return {
    id: strOrNull(r.id),
    tokenizationId: strOrNull(r.tokenizationId ?? r.tokenization_id),
    name: strOrNull(r.name),
    neighborhood: strOrNull(r.neighborhood),
  };
};

const normalizePayoutRequest = (value: unknown): FmzCoOwnerPayoutRow['payoutRequest'] => {
  if (!value || typeof value !== 'object') return null;
  const r = recordOf(value);
  const id = strOrNull(r.id);
  const status = strOrNull(r.status) as FmzPayoutRequestStatus | null;
  if (!id || !status) return null;
  return { id, status };
};

// ─── Row normalizer ───────────────────────────────────────────────────────────

const normalizeRow = (value: unknown): FmzCoOwnerPayoutRow => {
  const r = recordOf(value);
  return {
    sourceType: str(r.sourceType ?? r.source_type, 'rent_distribution') as FmzCoOwnerPayoutRow['sourceType'],
    sourceReferenceId: str(r.sourceReferenceId ?? r.source_reference_id),
    property: normalizeProperty(r.property),
    cycleLabel: strOrNull(r.cycleLabel ?? r.cycle_label),
    eventDate: str(r.eventDate ?? r.event_date),
    ownerUserId: str(r.ownerUserId ?? r.owner_user_id),
    ownerName: strOrNull(r.ownerName ?? r.owner_name),
    tokensBefore: numOrNull(r.tokensBefore ?? r.tokens_before),
    tokensAfter: numOrNull(r.tokensAfter ?? r.tokens_after),
    ownershipPctBefore: strOrNull(r.ownershipPctBefore ?? r.ownership_pct_before),
    ownershipPctAfter: strOrNull(r.ownershipPctAfter ?? r.ownership_pct_after),
    rentShareBrl: str(r.rentShareBrl ?? r.rent_share_brl, '0'),
    tokenSaleShareBrl: str(r.tokenSaleShareBrl ?? r.token_sale_share_brl, '0'),
    accruedBalanceBrl: str(r.accruedBalanceBrl ?? r.accrued_balance_brl, '0'),
    readyForPayout: bool(r.readyForPayout ?? r.ready_for_payout, false),
    payoutRequest: normalizePayoutRequest(r.payoutRequest ?? r.payout_request),
    tenantName: strOrNull(r.tenantName ?? r.tenant_name),
    rentTotalBrl: strOrNull(r.rentTotalBrl ?? r.rent_total_brl),
    tokenQuantity: numOrNull(r.tokenQuantity ?? r.token_quantity),
    tokenUnitValueBrl: strOrNull(r.tokenUnitValueBrl ?? r.token_unit_value_brl),
  };
};

const normalizeSummary = (value: unknown): FmzCoOwnerPayoutsSummary => {
  const r = recordOf(value);
  return {
    totalPendingBrl: str(r.totalPendingBrl ?? r.total_pending_brl, '0.00'),
    coOwnersAwaitingCount: num(r.coOwnersAwaitingCount ?? r.co_owners_awaiting_count, 0),
    openTransactionsCount: num(r.openTransactionsCount ?? r.open_transactions_count, 0),
    belowMinimumCount: num(r.belowMinimumCount ?? r.below_minimum_count, 0),
    belowMinimumTotalBrl: str(r.belowMinimumTotalBrl ?? r.below_minimum_total_brl, '0.00'),
  };
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function listCoOwnerPayouts(
  filters: FmzCoOwnerPayoutsFilters,
): Promise<FmzCoOwnerPayoutsListResponse> {
  const params: Record<string, string> = { competenceMonth: filters.competenceMonth };
  if (filters.status) params.status = filters.status;
  if (filters.propertyTokenizationId) params.propertyTokenizationId = filters.propertyTokenizationId;

  const { data } = await firmezaApiClient.get(ADMIN_CO_OWNER_PAYOUTS_PATH, { params });
  const r = recordOf(data);

  return {
    rows: arr<unknown>(r.rows).map(normalizeRow),
    summary: normalizeSummary(r.summary),
  };
}

export async function approvePayoutRequest(requestId: string): Promise<FmzApprovePayoutRequestResult> {
  const { data } = await firmezaApiClient.post(
    `${PAYOUT_REQUESTS_PATH}/${encodeURIComponent(requestId)}/approve`,
  );
  const r = recordOf(recordOf(data).result);
  return {
    status: str(r.status, 'in_progress') as FmzApprovePayoutRequestResult['status'],
    currentStatus: strOrNull(r.currentStatus ?? r.current_status) ?? undefined,
    transferId: strOrNull(r.transferId ?? r.transfer_id) ?? undefined,
  };
}

export async function rejectPayoutRequest(
  requestId: string,
  reason?: string,
): Promise<FmzRejectPayoutRequestResult> {
  const { data } = await firmezaApiClient.post(
    `${PAYOUT_REQUESTS_PATH}/${encodeURIComponent(requestId)}/reject`,
    reason ? { reason } : {},
  );
  const r = recordOf(recordOf(data).result);
  return {
    status: str(r.status, 'in_progress') as FmzRejectPayoutRequestResult['status'],
    currentStatus: strOrNull(r.currentStatus ?? r.current_status) ?? undefined,
  };
}

export async function approvePayoutRequestsBatch(
  requestIds: string[],
): Promise<FmzApproveBatchItemResult[]> {
  const { data } = await firmezaApiClient.post(`${PAYOUT_REQUESTS_PATH}/approve-batch`, {
    ids: requestIds,
  });
  const r = recordOf(data);
  return arr<unknown>(r.results).map((item) => {
    const i = recordOf(item);
    return {
      id: str(i.id),
      status: str(i.status, 'failed'),
      error: strOrNull(i.error) ?? undefined,
    };
  });
}
