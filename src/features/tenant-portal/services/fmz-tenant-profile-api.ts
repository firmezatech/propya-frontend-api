import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  TenantProfileResponse,
  TenantKycDocumentUploadParams,
} from '../domain/fmz-tenant-profile.types';

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
  return data as TenantProfileResponse;
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
