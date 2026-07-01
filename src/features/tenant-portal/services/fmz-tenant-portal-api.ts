import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzTenantDashboard,
  FmzTenantDashboardPayload,
  FmzTenantPaymentHistoryItem,
  FmzUserWallet,
  FmzUserWalletMovement,
} from '../domain/fmz-tenant-portal.types';

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const resolvePaymentItemId = (row: Record<string, unknown>): string | null =>
  str(row.id)
  ?? str(row.paymentTransactionId ?? row.payment_transaction_id)
  ?? str(row.rentChargeId ?? row.rent_charge_id);

const resolvePaymentItemReference = (row: Record<string, unknown>, fallback?: string | null): string | null =>
  str(row.reference ?? row.label ?? row.competence ?? row.competency)
  ?? str(row.monthLabel ?? row.month_label ?? row.month)
  ?? fallback ?? null;

const resolvePaymentItemAmount = (row: Record<string, unknown>): number =>
  num(
    row.amount ?? row.totalDueAmount ?? row.total_due_amount ?? row.totalAmount ?? row.total_amount,
    Number.NaN,
  );

const toSnakeCase = (camelKey: string): string => camelKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Composition fields arrive camelCase from the backend; snake_case is kept as a defensive
// fallback for any caller that hasn't gone through the JS API layer.
const numericFieldOrNull = (row: Record<string, unknown>, camelKey: string): number | null =>
  num(row[camelKey] ?? row[toSnakeCase(camelKey)], 0) || null;

const normalizePaymentHistoryItem = (value: unknown, fallbackReference?: string | null): FmzTenantPaymentHistoryItem | null => {
  const row = toRecord(value);
  const id = resolvePaymentItemId(row);
  const reference = resolvePaymentItemReference(row, fallbackReference);
  const amount = resolvePaymentItemAmount(row);

  if (!id && !reference) return null;

  return {
    id: id ?? reference ?? 'payment-history-item',
    reference: reference ?? 'Competência',
    dueDate: str(row.dueDate ?? row.due_date),
    paidAt: str(row.paidAt ?? row.paid_at ?? row.paymentDate ?? row.payment_date),
    status: str(row.status ?? row.statusDescription ?? row.status_description),
    amount: Number.isFinite(amount) ? amount : 0,
    baseRentAmount: numericFieldOrNull(row, 'baseRentAmount'),
    adjustmentAmount: numericFieldOrNull(row, 'adjustmentAmount'),
    discountAmount: numericFieldOrNull(row, 'discountAmount'),
    discountedRentAmount: numericFieldOrNull(row, 'discountedRentAmount'),
    rentalAdminFeeAmount: numericFieldOrNull(row, 'rentalAdminFeeAmount'),
    condominiumFeeAmount: numericFieldOrNull(row, 'condominiumFeeAmount'),
    totalPurchasedTokens: numericFieldOrNull(row, 'totalPurchasedTokens'),
    tokenPurchaseAmount: numericFieldOrNull(row, 'tokenPurchaseAmount'),
    tokenFeeAmount: numericFieldOrNull(row, 'tokenFeeAmount'),
    tokensAccumulated: numericFieldOrNull(row, 'tokensAccumulated'),
    ownershipPercentageAccumulated: numericFieldOrNull(row, 'ownershipPercentageAccumulated'),
    paymentProvider: str(row.paymentProvider ?? row.payment_provider ?? row.provider),
    paymentMethod: str(row.paymentMethod ?? row.payment_method) ?? 'boleto',
    downloadUrl: str(row.downloadUrl ?? row.download_url ?? row.boletoUrl ?? row.boleto_url),
    digitableLine: str(row.digitableLine ?? row.digitable_line),
    tokenOrderId: str(row.tokenOrderId ?? row.token_order_id),
  };
};

const findPaymentHistoryInDashboardData = (dashboard: FmzTenantDashboard): FmzTenantPaymentHistoryItem[] => {
  const root = toRecord(dashboard);
  const fallbackLabel = dashboard.competence?.label ?? dashboard.competence?.month ?? null;
  const candidates = [
    root.paymentHistory,
    root.payment_history,
    root.history,
    root.payments,
    root.rentCharges,
    root.rent_charges,
    toRecord(root.parameters).paymentHistory,
    toRecord(root.parameters).payment_history,
  ];

  for (const candidate of candidates) {
    const items = toArray(candidate)
      .map((item) => normalizePaymentHistoryItem(item, fallbackLabel))
      .filter((item): item is FmzTenantPaymentHistoryItem => item !== null);
    if (items.length > 0) return items;
  }

  return [];
};

const buildFallbackPaymentHistoryEntry = (dashboard: FmzTenantDashboard): FmzTenantPaymentHistoryItem[] => {
  const { boleto, monthlySummary: summary, competence } = dashboard;
  if (!boleto && !summary) return [];

  return [{
    id: str(boleto?.paymentTransactionId) ?? str(summary?.rentChargeId) ?? 'current-rent-charge',
    reference: competence?.label ?? competence?.month ?? 'Competência atual',
    dueDate: summary?.dueDate ?? null,
    paidAt: boleto?.paidAt ?? null,
    status: boleto?.status ?? summary?.status ?? null,
    amount: num(summary?.totalDueAmount),
    paymentProvider: boleto?.paymentProvider ?? null,
    paymentMethod: boleto?.paymentMethod ?? 'boleto',
    downloadUrl: boleto?.downloadUrl ?? null,
    digitableLine: boleto?.digitableLine ?? null,
  }];
};

const buildTenantPaymentHistoryFromDashboard = (dashboard: FmzTenantDashboard | null): FmzTenantPaymentHistoryItem[] => {
  if (!dashboard) return [];
  const fromData = findPaymentHistoryInDashboardData(dashboard);
  return fromData.length > 0 ? fromData : buildFallbackPaymentHistoryEntry(dashboard);
};

const WALLET_MOVEMENT_TYPES = new Set<string>(['buy', 'rent']);

const resolveMovementType = (value: unknown): 'buy' | 'rent' | null => {
  const raw = str(value);
  return raw !== null && WALLET_MOVEMENT_TYPES.has(raw) ? (raw as 'buy' | 'rent') : null;
};

const normalizeWalletMovement = (raw: unknown): FmzUserWalletMovement => {
  const row = toRecord(raw);
  return {
    occurredAt: str(row.occurredAt),
    date: str(row.date),
    time: str(row.time),
    description: str(row.description),
    subtype: str(row.subtype),
    type: resolveMovementType(row.type),
    typeLabel: str(row.typeLabel),
    tokens: num(row.tokens),
    amount: num(row.amount),
    status: str(row.status),
    statusLabel: str(row.statusLabel),
    referenceId: str(row.referenceId),
  };
};

export async function getTenantDashboard(propertyId?: string | number | null): Promise<FmzTenantDashboardPayload> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(String(propertyId))}` : '';
  const { data } = await firmezaApiClient.get(`/tenant/dashboard${query}`);
  return data as FmzTenantDashboardPayload;
}

export async function getCurrentTenantDashboard(propertyId?: string | number | null): Promise<FmzTenantDashboard | null> {
  const payload = await getTenantDashboard(propertyId);
  return payload.hasData === false ? null : payload.dashboard ?? null;
}

export async function getCurrentTenantPaymentHistory(propertyId?: string | number | null): Promise<FmzTenantPaymentHistoryItem[]> {
  const dashboard = await getCurrentTenantDashboard(propertyId);
  return buildTenantPaymentHistoryFromDashboard(dashboard);
}

export async function getUserWallet(params?: { from?: string; to?: string; offset?: number; limit?: number }): Promise<FmzUserWallet> {
  const searchParams = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      )
    : null;
  const query = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const { data } = await firmezaApiClient.get(`/tenant/my-wallet${query}`);
  const root = toRecord(data);
  const summaryRaw = toRecord(root.summary);
  const periodRaw = toRecord(root.period);
  const paginationRaw = toRecord(root.pagination);

  return {
    period: root.period
      ? { from: str(periodRaw.from), to: str(periodRaw.to), days: num(periodRaw.days) }
      : null,
    summary: {
      investedInTokens: num(summaryRaw.investedInTokens),
      purchaseCount: num(summaryRaw.purchaseCount),
      tokensInWallet: num(summaryRaw.tokensInWallet),
      ownershipPercent: num(summaryRaw.ownershipPercent),
      rentSavings: num(summaryRaw.rentSavings),
      totalOutflows: num(summaryRaw.totalOutflows),
      totalInflows: num(summaryRaw.totalInflows),
      netBalance: num(summaryRaw.netBalance),
    },
    movements: toArray(root.movements).map(normalizeWalletMovement),
    pagination: root.pagination
      ? {
          total: num(paginationRaw.total),
          offset: num(paginationRaw.offset),
          limit: num(paginationRaw.limit),
          hasMore: Boolean(paginationRaw.hasMore),
        }
      : null,
  };
}
