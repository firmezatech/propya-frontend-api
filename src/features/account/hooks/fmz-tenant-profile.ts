'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTenantProfile, uploadTenantKycDocument } from '../../tenant-portal/services/fmz-tenant-profile-api';
import type { TenantKycDocumentUploadParams, TenantProfileResponse } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── State Shape ──────────────────────────────────────────────────────────────

type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: TenantProfileResponse };

// ─── Upload State Shape ───────────────────────────────────────────────────────

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

// ─── Hook Return ──────────────────────────────────────────────────────────────

type UseTenantProfileReturn = {
  profileState: ProfileState;
  uploadState: UploadState;
  refetchProfile: () => Promise<void>;
  uploadKycDocument: (params: TenantKycDocumentUploadParams) => Promise<void>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the tenant profile from GET /tenant/profile and exposes
 * an upload function that posts to POST /tenant/kyc/documents,
 * then refetches the profile to reflect backend-resolved statuses.
 *
 * Responsibility boundary:
 *   - Data fetching and upload orchestration live here.
 *   - Rendering lives in the components.
 *   - Business rules (completion %, KYC status) live in the backend.
 *
 * Error contract:
 *   - `uploadKycDocument` THROWS on upload failure so the caller can
 *     distinguish success from failure and show the correct toast.
 *   - Profile refetch failures are handled internally (profileState → 'error')
 *     and do NOT cause `uploadKycDocument` to throw — the document was already
 *     sent; only the profile refresh failed.
 *   - `refetchProfile` (alias of fetchProfile) never throws — errors are
 *     communicated via profileState.
 */
export function useFmzTenantProfile(): UseTenantProfileReturn {
  const [profileState, setProfileState] = useState<ProfileState>({ status: 'loading' });
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  // refetchProfile never throws — errors are reflected in profileState.
  const refetchProfile = useCallback(async () => {
    setProfileState({ status: 'loading' });
    try {
      const response = await getTenantProfile();
      setProfileState({ status: 'ready', data: response });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível carregar os dados do perfil.';
      setProfileState({ status: 'error', message });
    }
  }, []);

  const uploadKycDocument = useCallback(async (params: TenantKycDocumentUploadParams) => {
    setUploadState({ status: 'uploading' });

    // ── Phase 1: Upload document ───────────────────────────────────────────────
    // Throws on any failure so the caller can skip the success toast.
    // Error state is set here — no need for the caller to set it separately.
    try {
      await uploadTenantKycDocument(params);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Erro ao enviar o documento. Tente novamente.';
      setUploadState({ status: 'error', message });
      // Rethrow — the caller MUST NOT show the success toast when this throws.
      throw error;
    }

    // ── Phase 2: Upload succeeded — update state and refresh profile ───────────
    // refetchProfile() handles its own errors internally and never throws.
    // If refetch fails: uploadState stays 'success' (document was sent);
    // profileState becomes 'error' and the KYC section shows a retry button.
    setUploadState({ status: 'success' });
    await refetchProfile();
  }, [refetchProfile]);

  useEffect(() => {
    void refetchProfile();
  }, [refetchProfile]);

  return {
    profileState,
    uploadState,
    refetchProfile,
    uploadKycDocument,
  };
}
