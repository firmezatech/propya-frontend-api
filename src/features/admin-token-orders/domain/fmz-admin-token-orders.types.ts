// ─── Status ───────────────────────────────────────────────────────────────────

export type FmzTokenOrderDbStatus =
  | 'pending'
  | 'reserved'
  | 'payment_pending'
  | 'settlement_pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'expired';

export type FmzAdminOrderStatus = 'pending' | 'completed' | 'error' | 'refunded' | 'cancelled';

// Tradução DB status → PT-BR (D-2)
export const STATUS_LABEL_PT: Record<string, string> = {
  pending:            'Pendente',
  reserved:           'Pendente',
  payment_pending:    'Aguardando pagamento',
  settlement_pending: 'Processando entrega',
  completed:          'Concluída',
  failed:             'Com erro',
  refunded:           'Reembolsada',
  cancelled:          'Cancelada',
  expired:            'Expirada',
};

// Cor da borda esquerda do accordion por adminStatus
export const ADMIN_STATUS_BORDER: Record<FmzAdminOrderStatus, string> = {
  pending:   'border-l-[#F5A623]',
  completed: 'border-l-[#1A8C5B]',
  error:     'border-l-[#D94035]',
  refunded:  'border-l-[#7B61FF]',
  cancelled: 'border-l-[#9AA3B0]',
};

// Cor do badge por adminStatus
export const ADMIN_STATUS_BADGE: Record<FmzAdminOrderStatus, string> = {
  pending:   'bg-[#FFF3DC] text-[#B87A00]',
  completed: 'bg-[#F0FAF5] text-[#1A8C5B]',
  error:     'bg-[#FFF0EF] text-[#D94035]',
  refunded:  'bg-[#F3F0FF] text-[#7B61FF]',
  cancelled: 'bg-[#F7F8FA] text-[#6B7280]',
};

// ─── Timeline ────────────────────────────────────────────────────────────────

export type FmzTokenOrderTimelineEventType = 'info' | 'ok' | 'error' | 'warn';

export type FmzTokenOrderTimelineEvent = {
  id: string;
  type: FmzTokenOrderTimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  isSynthetic: boolean;
};

// Mapeamento de event_type do DB → label PT-BR (D-4)
export const ORDER_DELIVERY_EVENT_LABELS: Record<string, { type: FmzTokenOrderTimelineEventType; title: string }> = {
  delivery_attempt_failed: { type: 'error', title: 'Falha na entrega de tokens' },
  delivery_succeeded:      { type: 'ok',    title: 'Tokens entregues com sucesso' },
  refund_opened:           { type: 'warn',  title: 'Reembolso aberto' },
  refund_processing:       { type: 'info',  title: 'Reembolso em processamento' },
  refund_succeeded:        { type: 'ok',    title: 'Reembolso confirmado' },
  refund_failed:           { type: 'error', title: 'Tentativa de reembolso falhou' },
};

// ─── Documents ───────────────────────────────────────────────────────────────

export type FmzTokenOrderReceiptData = {
  receiptRef?: string;
  buyerName?: string;
  buyerEmail?: string;
  propertyName?: string;
  tokenQuantity?: number;
  paidAmount?: string;
  receiptDate?: string;
};

export type FmzAdminTokenOrderDocuments = {
  receipt: { data: FmzTokenOrderReceiptData } | null;
  nf: { url: string | null; number: string | null } | null;
  boleto: { url: string | null } | null;
};

// ─── Order ───────────────────────────────────────────────────────────────────

export type FmzAdminTokenOrderBuyer = {
  userId: string;
  name: string | null;
  email: string | null;
  initials: string;
};

export type FmzAdminTokenOrderProperty = {
  id: string | null;
  address: string | null;
  neighborhood: string | null;
};

export type FmzAdminTokenOrderTokens = {
  quantity: string;
  unitPrice: string;
};

export type FmzAdminTokenOrder = {
  id: string;
  status: FmzTokenOrderDbStatus;
  adminStatus: FmzAdminOrderStatus;
  orderSource: string;
  buyer: FmzAdminTokenOrderBuyer;
  property: FmzAdminTokenOrderProperty;
  tokens: FmzAdminTokenOrderTokens;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  currency: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  payment: { paidAt: string | null };
  documents: FmzAdminTokenOrderDocuments;
  createdAt: string;
  completedAt: string | null;
};

// ─── Summary ─────────────────────────────────────────────────────────────────

export type FmzAdminTokenOrdersSummary = {
  total: number;
  completed: number;
  error: number;
  refunded: number;
  pending: number;
  cancelled: number;
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export type FmzAdminTokenOrdersPagination = {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

// ─── Filters ─────────────────────────────────────────────────────────────────

export type FmzAdminTokenOrdersFilters = {
  propertyId?: string;
  status?: FmzAdminOrderStatus | '';
  search?: string;
};

// ─── API response ─────────────────────────────────────────────────────────────

export type FmzAdminTokenOrdersListResponse = {
  summary: FmzAdminTokenOrdersSummary;
  orders: FmzAdminTokenOrder[];
  pagination: FmzAdminTokenOrdersPagination;
};

// ─── Delivery event (from backend) ───────────────────────────────────────────

export type FmzDeliveryEvent = {
  id: string;
  event_type: string;
  attempt_no: number | null;
  reason: string | null;
  amount: number | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
};
