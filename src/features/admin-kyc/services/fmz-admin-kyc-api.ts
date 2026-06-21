import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzAdminKycFilters,
  FmzAdminKycListResponse,
  FmzAdminKycUser,
  FmzKycDiditDecision,
  FmzKycDocumentType,
  FmzKycProperty,
  FmzKycStatus,
  FmzKycSummary,
} from '../domain';

const ADMIN_KYC_PATH =
  process.env.NEXT_PUBLIC_FMZ_ADMIN_KYC_PATH || '/admin/kyc/users';

// ─── Primitive coercions ──────────────────────────────────────────────────────

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const strOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1'].includes(value.toLowerCase());
  return fallback;
};

const arr = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// ─── Status normalizer ────────────────────────────────────────────────────────

const kycStatusOf = (value: unknown): FmzKycStatus => {
  const raw = str(value).toLowerCase();
  if (raw === 'verified')                                  return 'verified';
  if (raw === 'under_review')                              return 'under_review';
  if (raw === 'rejected' || raw === 'needs_resubmission') return 'rejected';
  return 'pending';
};

const VALID_DOC_TYPES = new Set<FmzKycDocumentType>([
  'rg', 'cnh', 'passaporte', 'selfie', 'comprovante_residencia', 'cpf',
]);

const docTypeOf = (value: unknown): FmzKycDocumentType | null => {
  const raw = str(value).toLowerCase() as FmzKycDocumentType;
  return VALID_DOC_TYPES.has(raw) ? raw : null;
};

// ─── Sub-object normalizers ───────────────────────────────────────────────────

const normalizeProperty = (value: unknown): FmzKycProperty | null => {
  if (!value || typeof value !== 'object') return null;
  const r = recordOf(value);
  const id = str(r.id);
  if (!id) return null;
  return { id, address: str(r.address) };
};

const normalizeDiditDecision = (value: unknown): FmzKycDiditDecision | null => {
  if (!value || typeof value !== 'object') return null;
  const r = recordOf(value);
  return {
    status: str(r.status, 'Declined'),
    warnings: arr<unknown>(r.warnings).map((w) => str(w)).filter(Boolean),
  };
};

// ─── Full user normalizer ─────────────────────────────────────────────────────

export const normalizeAdminKycUser = (value: unknown): FmzAdminKycUser => {
  const r = recordOf(value);
  return {
    userId: str(r.userId ?? r.user_id),
    name: str(r.name),
    email: str(r.email),
    phone: strOrNull(r.phone),
    city: strOrNull(r.city),
    registeredAt: str(r.registeredAt ?? r.registered_at),
    kycStatus: kycStatusOf(r.kycStatus ?? r.kyc_status),
    releasedForResubmission: bool(r.releasedForResubmission ?? r.released_for_resubmission),
    lastSessionAt: strOrNull(r.lastSessionAt ?? r.last_session_at),
    attemptCount: num(r.attemptCount ?? r.attempt_count, 0),
    diditDecision: normalizeDiditDecision(r.diditDecision ?? r.didit_decision),
    property: normalizeProperty(r.property),
    documents: arr<unknown>(r.documents).map(docTypeOf).filter((d): d is FmzKycDocumentType => d !== null),
    identityDocumentType:    strOrNull(r.identityDocumentType    ?? r.identity_document_type),
    identityDocumentCountry: strOrNull(r.identityDocumentCountry ?? r.identity_document_country),
  };
};

// ─── Summary normalizer ───────────────────────────────────────────────────────

const normalizeSummary = (value: unknown): FmzKycSummary => {
  const r = recordOf(value);
  return {
    pendingCount: num(r.pendingCount ?? r.pending_count, 0),
    inReviewCount: num(r.inReviewCount ?? r.in_review_count, 0),
    approvedCount: num(r.approvedCount ?? r.approved_count, 0),
    declinedCount: num(r.declinedCount ?? r.declined_count, 0),
  };
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function listAdminKycUsers(
  filters: FmzAdminKycFilters,
): Promise<FmzAdminKycListResponse> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.propertyId) params.propertyId = filters.propertyId;
  if (filters.propertyFilter && filters.propertyFilter !== 'all')
    params.propertyFilter = filters.propertyFilter;
  if (filters.status) {
    // 'released' is a frontend-only display status — map to backend params
    if (filters.status === 'released') {
      params.status = 'rejected';
      params.releasedForResubmission = 'true';
    } else {
      params.status = filters.status;
    }
  }
  if (filters.cursor) params.cursor = filters.cursor;

  const { data } = await firmezaApiClient.get(ADMIN_KYC_PATH, { params });
  const r = recordOf(data);

  return {
    summary: normalizeSummary(r.summary),
    users: arr<unknown>(r.users).map(normalizeAdminKycUser),
    nextCursor: strOrNull(r.nextCursor ?? r.next_cursor),
    total: num(r.total, 0),
  };
}

export async function releaseKycUser(userId: string): Promise<void> {
  await firmezaApiClient.post(
    `${ADMIN_KYC_PATH}/${encodeURIComponent(userId)}/release`,
  );
}
