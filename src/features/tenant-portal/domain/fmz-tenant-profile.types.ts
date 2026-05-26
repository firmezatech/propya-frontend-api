// ─── KYC Document Statuses ──────────────────────────────────────────────────
// Single source of truth — these values come directly from the backend.
// The frontend must never infer or compute these locally.

export type TenantKycDocumentStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'needs_resubmission';

// ─── KYC Document ──────────────────────────────────────────────────────────────

export type TenantKycDocument = {
  requirementKey: string;
  label: string;
  description: string;
  documentType: string;
  status: TenantKycDocumentStatus;
  documentId: string | null;
  fileName: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

// ─── Profile Completion ────────────────────────────────────────────────────────
// All completion values come from the backend; the frontend only renders them.
// All array fields are required — the backend always returns every bucket, even
// when empty. The frontend must not treat missing buckets as "no documents".

export type TenantProfileCompletion = {
  percentage: number;
  status: string;
  completedItems: number;
  totalItems: number;
  completedProfileFields: number;
  totalProfileFields: number;
  completedDocuments: number;
  totalDocuments: number;
  missingFields: string[];
  missingDocuments: string[];
  pendingDocuments: string[];       // not yet submitted
  underReviewDocuments: string[];   // uploaded, waiting for analysis
  verifiedDocuments: string[];
  rejectedDocuments: string[];
  needsResubmissionDocuments: string[];
};

// ─── KYC Overall Status ────────────────────────────────────────────────────────

export type TenantKycStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'needs_resubmission'
  | string; // Allow forward-compatible extension

// ─── User & Address ────────────────────────────────────────────────────────────

export type TenantUserAddress = {
  addressLine1: string | null;
  addressLine2: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
};

export type TenantUserData = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  phoneE164: string | null;
  birthdate: string | null;
  address: TenantUserAddress;
};

// ─── KYC Section ──────────────────────────────────────────────────────────────

export type TenantProfileKyc = {
  status: TenantKycStatus;
  documents: TenantKycDocument[];
};

// ─── Root Response ────────────────────────────────────────────────────────────

export type TenantProfileResponse = {
  profile: {
    user: TenantUserData;
    completion: TenantProfileCompletion;
    kyc: TenantProfileKyc;
  };
};

// ─── KYC Upload ───────────────────────────────────────────────────────────────

export type TenantKycDocumentUploadParams = {
  requirementKey: string;
  documentType: string;
  file: File;
};
