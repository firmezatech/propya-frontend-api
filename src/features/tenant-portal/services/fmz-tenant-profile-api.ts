import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  TenantProfileResponse,
  TenantKycDocumentUploadParams,
} from '../domain/fmz-tenant-profile.types';

// ─── Profile response normalizer ──────────────────────────────────────────────
// The backend may return the profile nested in different envelope shapes.
// This function extracts the canonical { profile: { user, completion, kyc } }
// structure without throwing — real API errors surface as HTTP errors before
// this point; missing fields are surfaced as a clear TypeError downstream.

type UnknownRecord = Record<string, unknown>;

const rec = (v: unknown): UnknownRecord => (v && typeof v === 'object' && !Array.isArray(v) ? v as UnknownRecord : {});

function normalizeProfileResponse(raw: unknown): TenantProfileResponse {
  // Unwrap common envelope layers: { data: ... }, { success, data: ... }
  let payload = rec(raw);
  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    payload = rec(payload.data);
  }

  // Extract the profile block from whichever key holds it
  const profileBlock =
    rec(payload.profile) ??
    rec((payload as UnknownRecord).tenant_profile) ??
    rec((payload as UnknownRecord).tenantProfile);

  // If the block already has the expected sub-keys, return it
  if (profileBlock.user || profileBlock.completion || profileBlock.kyc) {
    return { profile: profileBlock } as TenantProfileResponse;
  }

  // Last resort: treat the payload itself as the profile block
  // (e.g. backend returns { user, completion, kyc } directly)
  if (payload.user || payload.completion || payload.kyc) {
    return { profile: payload } as TenantProfileResponse;
  }

  // Pass through as-is and let TypeScript/runtime surface the mismatch
  return raw as TenantProfileResponse;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated tenant's full profile, including KYC documents
 * and backend-calculated completion state.
 *
 * Source of truth: GET /tenant/profile
 * The frontend must not derive completion percentages or KYC statuses locally.
 */
export async function getTenantProfile(): Promise<TenantProfileResponse> {
  const { data } = await firmezaApiClient.get('/tenant/profile');
  return normalizeProfileResponse(data);
}

// ─── KYC Document Upload ──────────────────────────────────────────────────────

/**
 * Uploads a KYC document to the backend via multipart/form-data.
 *
 * Source of truth: POST /tenant/kyc/documents
 * After a successful upload, callers must refetch the profile to get the
 * updated document status from the backend — the frontend must not manually
 * set the status to `under_review`; only the backend owns that transition.
 */
export async function uploadTenantKycDocument({
  requirementKey,
  documentType,
  file,
}: TenantKycDocumentUploadParams): Promise<void> {
  const formData = new FormData();
  formData.append('requirementKey', requirementKey);
  formData.append('documentType', documentType);
  formData.append('file', file);

  // Do NOT set Content-Type manually — Axios derives the multipart boundary automatically.
  await firmezaApiClient.post('/tenant/kyc/documents', formData);
}
