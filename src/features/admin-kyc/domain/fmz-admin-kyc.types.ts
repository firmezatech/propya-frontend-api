// ─── KYC status (backend values) ─────────────────────────────────────────────

export type FmzKycStatus = 'pending' | 'in_review' | 'verified' | 'declined';

/**
 * Display status derivado no frontend.
 * 'released' = kycStatus 'declined' + releasedForResubmission true.
 */
export type FmzKycDisplayStatus = FmzKycStatus | 'released';

// ─── Document types ───────────────────────────────────────────────────────────

export type FmzKycDocumentType =
  | 'rg'
  | 'cnh'
  | 'passaporte'
  | 'selfie'
  | 'comprovante_residencia'
  | 'cpf';

// ─── Didit decision ───────────────────────────────────────────────────────────

export type FmzKycDiditDecision = {
  status: string;
  warnings: string[];
};

// ─── Property association ─────────────────────────────────────────────────────

export type FmzKycProperty = {
  id: string;
  address: string;
};

// ─── User row ─────────────────────────────────────────────────────────────────

export type FmzAdminKycUser = {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  registeredAt: string;
  kycStatus: FmzKycStatus;
  releasedForResubmission: boolean;
  lastSessionAt: string | null;
  attemptCount: number;
  diditDecision: FmzKycDiditDecision | null;
  property: FmzKycProperty | null;
  documents: FmzKycDocumentType[];
};

// ─── Summary strip ────────────────────────────────────────────────────────────

export type FmzKycSummary = {
  pendingCount: number;
  inReviewCount: number;
  approvedCount: number;
  declinedCount: number;
};

// ─── List response ────────────────────────────────────────────────────────────

export type FmzAdminKycListResponse = {
  summary: FmzKycSummary;
  users: FmzAdminKycUser[];
  nextCursor: string | null;
  total: number;
};

// ─── List filters ─────────────────────────────────────────────────────────────

export type FmzKycPropertyFilter = 'all' | 'with_property' | 'without_property';

export type FmzAdminKycFilters = {
  search: string;
  propertyId: string;
  propertyFilter: FmzKycPropertyFilter;
  status: FmzKycDisplayStatus | '';
  cursor: string | null;
};

// ─── Domain utility ───────────────────────────────────────────────────────────

/**
 * Derives the display status from backend fields.
 * 'released' is a frontend-only concept: declined + releasedForResubmission=true.
 */
export function resolveKycDisplayStatus(user: Pick<FmzAdminKycUser, 'kycStatus' | 'releasedForResubmission'>): FmzKycDisplayStatus {
  if (user.kycStatus === 'declined' && user.releasedForResubmission) return 'released';
  return user.kycStatus;
}
