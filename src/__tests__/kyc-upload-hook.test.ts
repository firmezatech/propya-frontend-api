/**
 * Tests: useTenantProfile — upload error contract
 *
 * Verifies:
 *   - uploadKycDocument rethrows on API failure
 *   - uploadKycDocument does NOT throw on API success
 *   - uploadState.status is 'error' after upload failure (with message)
 *   - uploadState.status is 'uploading' while upload is in progress
 *   - uploadState.status is 'success' after upload completes
 *   - Profile refetch is triggered after successful upload
 *   - Profile refetch failure does NOT cause uploadKycDocument to throw
 *   - Success state is preserved even when profile refetch fails
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// Both are mocked at the module level before any imports of the hook.

const mockGetTenantProfile = jest.fn();
const mockUploadTenantKycDocument = jest.fn();

jest.mock('../features/tenant-portal/services/fmz-tenant-profile-api', () => ({
  getTenantProfile: (...args: unknown[]) => mockGetTenantProfile(...args),
  uploadTenantKycDocument: (...args: unknown[]) => mockUploadTenantKycDocument(...args),
}));

import { useTenantProfile } from '../features/account/hooks/use-tenant-profile';
import type { TenantKycDocumentUploadParams } from '../features/tenant-portal/domain/fmz-tenant-profile.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const UPLOAD_PARAMS: TenantKycDocumentUploadParams = {
  requirementKey: 'identity_document',
  documentType: 'identity_document',
  file: new File(['content'], 'rg.pdf', { type: 'application/pdf' }),
};

const PROFILE_RESPONSE = {
  profile: {
    user: {
      id: 'u1',
      fullName: 'Ana Silva',
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@example.com',
      phone: null,
      phoneE164: null,
      birthdate: null,
      address: {
        addressLine1: null,
        addressLine2: null,
        district: null,
        city: null,
        state: null,
        postalCode: null,
        country: 'BR',
      },
    },
    completion: {
      percentage: 50,
      status: 'partial',
      completedItems: 3,
      totalItems: 6,
      completedProfileFields: 3,
      totalProfileFields: 5,
      completedDocuments: 0,
      totalDocuments: 2,
      missingFields: [],
      missingDocuments: ['identity_document'],
      pendingDocuments: [],
      underReviewDocuments: [],
      verifiedDocuments: [],
      rejectedDocuments: [],
      needsResubmissionDocuments: [],
    },
    kyc: {
      status: 'pending',
      documents: [],
    },
  },
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: profile loads successfully
  mockGetTenantProfile.mockResolvedValue(PROFILE_RESPONSE);
});

// ─── Initial load ─────────────────────────────────────────────────────────────

describe('useTenantProfile — initial profile load', () => {

  it('starts in loading state', () => {
    const { result } = renderHook(() => useTenantProfile());
    expect(result.current.profileState.status).toBe('loading');
  });

  it('transitions to ready after successful profile fetch', async () => {
    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => {
      expect(result.current.profileState.status).toBe('ready');
    });
  });

  it('transitions to error after failed profile fetch', async () => {
    mockGetTenantProfile.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => {
      expect(result.current.profileState.status).toBe('error');
    });
    if (result.current.profileState.status === 'error') {
      expect(result.current.profileState.message).toBe('Network error');
    }
  });

});

// ─── Upload success ───────────────────────────────────────────────────────────

describe('useTenantProfile — upload success', () => {

  it('sets uploadState to "uploading" while upload is in progress', async () => {
    let resolveUpload!: () => void;
    mockUploadTenantKycDocument.mockImplementation(
      () => new Promise<void>((resolve) => { resolveUpload = resolve; }),
    );

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    let uploadPromise: Promise<void>;
    act(() => {
      uploadPromise = result.current.uploadKycDocument(UPLOAD_PARAMS);
    });

    await waitFor(() => {
      expect(result.current.uploadState.status).toBe('uploading');
    });

    // Resolve and let the rest finish
    await act(async () => {
      resolveUpload();
      await uploadPromise;
    });
  });

  it('sets uploadState to "success" after upload resolves', async () => {
    mockUploadTenantKycDocument.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await act(async () => {
      await result.current.uploadKycDocument(UPLOAD_PARAMS);
    });

    expect(result.current.uploadState.status).toBe('success');
  });

  it('does NOT throw on upload success', async () => {
    mockUploadTenantKycDocument.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await expect(
      act(async () => {
        await result.current.uploadKycDocument(UPLOAD_PARAMS);
      }),
    ).resolves.not.toThrow();
  });

  it('calls profile refetch (getTenantProfile) after successful upload', async () => {
    mockUploadTenantKycDocument.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    // Reset so we can count calls after the upload
    const callCountBefore = mockGetTenantProfile.mock.calls.length;

    await act(async () => {
      await result.current.uploadKycDocument(UPLOAD_PARAMS);
    });

    expect(mockGetTenantProfile.mock.calls.length).toBeGreaterThan(callCountBefore);
  });

});

// ─── Upload failure ───────────────────────────────────────────────────────────

describe('useTenantProfile — upload failure', () => {

  it('RETHROWS the error from uploadTenantKycDocument', async () => {
    const uploadError = new Error('Arquivo inválido. Envie PDF, JPG ou PNG.');
    mockUploadTenantKycDocument.mockRejectedValue(uploadError);

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await expect(
      act(async () => {
        await result.current.uploadKycDocument(UPLOAD_PARAMS);
      }),
    ).rejects.toThrow('Arquivo inválido. Envie PDF, JPG ou PNG.');
  });

  it('sets uploadState to "error" with the backend message on failure', async () => {
    mockUploadTenantKycDocument.mockRejectedValue(new Error('Formato de arquivo não suportado.'));

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await act(async () => {
      try {
        await result.current.uploadKycDocument(UPLOAD_PARAMS);
      } catch {
        // expected — rethrown by hook
      }
    });

    expect(result.current.uploadState.status).toBe('error');
    if (result.current.uploadState.status === 'error') {
      expect(result.current.uploadState.message).toBe('Formato de arquivo não suportado.');
    }
  });

  it('uses a generic fallback message when the thrown error is not an Error instance', async () => {
    mockUploadTenantKycDocument.mockRejectedValue('string error');

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await act(async () => {
      try {
        await result.current.uploadKycDocument(UPLOAD_PARAMS);
      } catch {
        // expected — rethrown
      }
    });

    expect(result.current.uploadState.status).toBe('error');
    if (result.current.uploadState.status === 'error') {
      expect(result.current.uploadState.message).toBe('Erro ao enviar o documento. Tente novamente.');
    }
  });

  it('does NOT call getTenantProfile (profile refetch) when upload fails', async () => {
    mockUploadTenantKycDocument.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    const callCountBefore = mockGetTenantProfile.mock.calls.length;

    await act(async () => {
      try {
        await result.current.uploadKycDocument(UPLOAD_PARAMS);
      } catch {
        // expected
      }
    });

    // Profile must NOT be refetched — upload failed before reaching phase 2
    expect(mockGetTenantProfile.mock.calls.length).toBe(callCountBefore);
  });

});

// ─── Refetch failure after successful upload ───────────────────────────────────

describe('useTenantProfile — profile refetch failure after successful upload', () => {

  it('does NOT throw from uploadKycDocument when profile refetch fails', async () => {
    mockUploadTenantKycDocument.mockResolvedValue(undefined);
    // First call (initial load) succeeds; second call (refetch) fails
    mockGetTenantProfile
      .mockResolvedValueOnce(PROFILE_RESPONSE)
      .mockRejectedValueOnce(new Error('Refetch network error'));

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    // uploadKycDocument must NOT throw even though profile refetch fails
    await expect(
      act(async () => {
        await result.current.uploadKycDocument(UPLOAD_PARAMS);
      }),
    ).resolves.not.toThrow();
  });

  it('sets uploadState to "success" even when profile refetch fails', async () => {
    mockUploadTenantKycDocument.mockResolvedValue(undefined);
    mockGetTenantProfile
      .mockResolvedValueOnce(PROFILE_RESPONSE)
      .mockRejectedValueOnce(new Error('Refetch failed'));

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await act(async () => {
      await result.current.uploadKycDocument(UPLOAD_PARAMS);
    });

    // Upload succeeded — uploadState reflects that
    expect(result.current.uploadState.status).toBe('success');
  });

  it('sets profileState to "error" when profile refetch fails after successful upload', async () => {
    mockUploadTenantKycDocument.mockResolvedValue(undefined);
    mockGetTenantProfile
      .mockResolvedValueOnce(PROFILE_RESPONSE)
      .mockRejectedValueOnce(new Error('Server unavailable'));

    const { result } = renderHook(() => useTenantProfile());
    await waitFor(() => expect(result.current.profileState.status).toBe('ready'));

    await act(async () => {
      await result.current.uploadKycDocument(UPLOAD_PARAMS);
    });

    // Profile state signals the refresh failure for the KYC retry section
    await waitFor(() => {
      expect(result.current.profileState.status).toBe('error');
    });
  });

});
