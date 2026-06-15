import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzAdminTokenOrder,
  FmzAdminTokenOrderDocuments,
  FmzAdminTokenOrderProperty,
  FmzAdminTokenOrderTokens,
  FmzAdminTokenOrdersFilters,
  FmzAdminTokenOrdersListResponse,
  FmzAdminTokenOrdersPagination,
  FmzAdminTokenOrdersSummary,
  FmzAdminOrderStatus,
  FmzTokenOrderDbStatus,
  FmzDeliveryEvent,
  FmzTokenOrderReceiptData,
} from '../domain';

const ADMIN_TOKEN_ORDERS_PATH = '/admin/token-orders';

// ─── Primitive coercions ──────────────────────────────────────────────────────

const recordOf = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v.trim() : fallback;

const strOrNull = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

const num = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// ─── Sub-normalizers ──────────────────────────────────────────────────────────

const VALID_DB_STATUSES = new Set<FmzTokenOrderDbStatus>([
  'pending', 'reserved', 'payment_pending', 'settlement_pending',
  'completed', 'failed', 'refunded', 'cancelled', 'expired',
]);
const VALID_ADMIN_STATUSES = new Set<FmzAdminOrderStatus>([
  'pending', 'completed', 'error', 'refunded', 'cancelled',
]);

const toDbStatus = (v: unknown): FmzTokenOrderDbStatus =>
  VALID_DB_STATUSES.has(v as FmzTokenOrderDbStatus) ? (v as FmzTokenOrderDbStatus) : 'pending';

const toAdminStatus = (v: unknown): FmzAdminOrderStatus =>
  VALID_ADMIN_STATUSES.has(v as FmzAdminOrderStatus) ? (v as FmzAdminOrderStatus) : 'pending';

const normalizeBuyer = (v: unknown) => {
  const r = recordOf(v);
  return {
    userId:   str(r.userId   ?? r.user_id),
    name:     strOrNull(r.name),
    email:    strOrNull(r.email),
    initials: str(r.initials, '?'),
  };
};

const normalizeProperty = (v: unknown): FmzAdminTokenOrderProperty => {
  const r = recordOf(v);
  return {
    id:           strOrNull(r.id),
    address:      strOrNull(r.address),
    neighborhood: strOrNull(r.neighborhood),
  };
};

const normalizeTokens = (v: unknown): FmzAdminTokenOrderTokens => {
  const r = recordOf(v);
  return {
    quantity:  str(r.quantity, '0'),
    unitPrice: str(r.unitPrice ?? r.unit_price, '0.00'),
  };
};

const normalizeDocuments = (v: unknown): FmzAdminTokenOrderDocuments => {
  const r = recordOf(v);

  const receiptRaw = recordOf(r.receipt);
  const receiptData = receiptRaw.data ? (recordOf(receiptRaw.data) as FmzTokenOrderReceiptData) : null;
  const receipt = receiptData ? { data: receiptData } : null;

  const nfRaw = recordOf(r.nf);
  const nf = (nfRaw.url || nfRaw.number)
    ? { url: strOrNull(nfRaw.url), number: strOrNull(nfRaw.number) }
    : null;

  const boletoRaw = recordOf(r.boleto);
  const boleto = boletoRaw.url ? { url: strOrNull(boletoRaw.url) } : null;

  return { receipt, nf, boleto };
};

const normalizeOrder = (v: unknown): FmzAdminTokenOrder => {
  const r = recordOf(v);
  const paymentRaw = recordOf(r.payment);
  return {
    id:            str(r.id),
    status:        toDbStatus(r.status),
    adminStatus:   toAdminStatus(r.adminStatus ?? r.admin_status),
    orderSource:   str(r.orderSource ?? r.order_source, 'platform'),
    buyer:         normalizeBuyer(r.buyer),
    property:      normalizeProperty(r.property),
    tokens:        normalizeTokens(r.tokens),
    grossAmount:   str(r.grossAmount  ?? r.gross_amount,  '0.00'),
    feeAmount:     str(r.feeAmount    ?? r.fee_amount,    '0.00'),
    netAmount:     str(r.netAmount    ?? r.net_amount,    '0.00'),
    currency:      str(r.currency, 'BRL'),
    paymentMethod: strOrNull(r.paymentMethod ?? r.payment_method),
    paymentStatus: strOrNull(r.paymentStatus ?? r.payment_status),
    payment:       { paidAt: strOrNull(paymentRaw.paidAt ?? paymentRaw.paid_at) },
    documents:     normalizeDocuments(r.documents),
    createdAt:     str(r.createdAt  ?? r.created_at),
    completedAt:   strOrNull(r.completedAt ?? r.completed_at),
  };
};

const normalizeSummary = (v: unknown): FmzAdminTokenOrdersSummary => {
  const r = recordOf(v);
  return {
    total:     num(r.total,     0),
    completed: num(r.completed, 0),
    error:     num(r.error,     0),
    refunded:  num(r.refunded,  0),
    pending:   num(r.pending,   0),
    cancelled: num(r.cancelled, 0),
  };
};

const normalizePagination = (v: unknown): FmzAdminTokenOrdersPagination => {
  const r = recordOf(v);
  return {
    total:   num(r.total,  0),
    offset:  num(r.offset, 0),
    limit:   num(r.limit,  50),
    hasMore: Boolean(r.hasMore ?? r.has_more),
  };
};

const normalizeDeliveryEvent = (v: unknown): FmzDeliveryEvent => {
  const r = recordOf(v);
  return {
    id:          str(r.id),
    event_type:  str(r.event_type),
    attempt_no:  typeof r.attempt_no === 'number' ? r.attempt_no : null,
    reason:      strOrNull(r.reason),
    amount:      typeof r.amount === 'number' ? r.amount : null,
    occurred_at: str(r.occurred_at),
    metadata:    recordOf(r.metadata),
  };
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchAdminTokenOrders(
  filters: FmzAdminTokenOrdersFilters = {},
  pagination: { offset?: number; limit?: number } = {},
): Promise<FmzAdminTokenOrdersListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.propertyId) params.propertyId = filters.propertyId;
  if (filters.status)     params.status     = filters.status;
  if (filters.search)     params.search     = filters.search;
  if (pagination.offset)  params.offset     = pagination.offset;
  if (pagination.limit)   params.limit      = pagination.limit;

  const { data } = await firmezaApiClient.get(ADMIN_TOKEN_ORDERS_PATH, { params });
  const r = recordOf(data);

  return {
    summary:    normalizeSummary(r.summary),
    orders:     arr<unknown>(r.orders).map(normalizeOrder),
    pagination: normalizePagination(r.pagination),
  };
}

export async function fetchTokenOrderDeliveryEvents(orderId: string): Promise<FmzDeliveryEvent[]> {
  const { data } = await firmezaApiClient.get(
    `${ADMIN_TOKEN_ORDERS_PATH}/${encodeURIComponent(orderId)}/delivery-events`,
  );
  const r = recordOf(data);
  return arr<unknown>(r.events).map(normalizeDeliveryEvent);
}
