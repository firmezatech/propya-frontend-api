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
 */
export function useTenantProfile(): UseTenantProfileReturn {
  const [profileState, setProfileState] = useState<ProfileState>({ status: 'loading' });
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  const fetchProfile = useCallback(async () => {
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
    try {
      await uploadTenantKycDocument(params);
      setUploadState({ status: 'success' });
      // Refetch so the UI reflects the backend's resolved document status.
      // The frontend must not manually set status = 'under_review'.
      await fetchProfile();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Erro ao enviar o documento. Tente novamente.';
      setUploadState({ status: 'error', message });
    }
  }, [fetchProfile]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    profileState,
    uploadState,
    refetchProfile: fetchProfile,
    uploadKycDocument,
  };
}
