/**
 * Tests: useFmzIdentityVerification — Didit completion → UI outcome
 *
 * Reproduces the reported bug ("após verificar a identidade, a página não muda")
 * and locks in the fix: the page must react to the Didit SDK's onComplete callback
 * immediately, instead of staying on the pre-verification panel waiting for the
 * asynchronous backend webhook (which cannot reach localhost during local testing).
 *
 * Verifies:
 *   - Completed flow (non-Declined) flips justVerified → SuccessView is shown
 *   - Client-side Declined short-circuits to justFailed → FailureView is shown
 *   - A failed SDK result surfaces a session error
 *   - startVerification asks the SDK to auto-close the modal on completion
 *   - An already-verified profile redirects on initial load
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockGetTenantProfile = jest.fn();
const mockStartDiditSession = jest.fn();
const mockDiditShared = {
  onComplete: undefined as undefined | ((result: unknown) => void),
  startVerification: jest.fn(),
  destroy: jest.fn(),
};

jest.mock('../features/tenant-portal/services/fmz-tenant-profile-api', () => ({
  getTenantProfile: (...args: unknown[]) => mockGetTenantProfile(...args),
}));

jest.mock('../features/identity-verification/services/fmz-identity-verification-api', () => ({
  startDiditSession: (...args: unknown[]) => mockStartDiditSession(...args),
}));

jest.mock('@didit-protocol/sdk-web', () => ({
  DiditSdk: { shared: mockDiditShared },
}));

import { useFmzIdentityVerification } from '../features/identity-verification/hooks/fmz-identity-verification';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const profile = (status: string) => ({
  profile: {
    kyc: { status },
    user: { fullName: 'Ana Silva', firstName: 'Ana' },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDiditShared.onComplete = undefined;
  mockDiditShared.startVerification.mockResolvedValue(undefined);
  mockStartDiditSession.mockResolvedValue({
    sessionId: 's1',
    verificationUrl: 'https://verify.didit.test/session/s1',
    status: 'Not Started',
    isNewSession: true,
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function startAndGetOnComplete(result: { current: { startVerification: () => Promise<void> } }) {
  await act(async () => {
    await result.current.startVerification();
  });
  const onComplete = mockDiditShared.onComplete;
  if (!onComplete) throw new Error('startVerification did not register an onComplete callback');
  return onComplete;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

it('flips justVerified the moment the Didit flow completes (no webhook wait)', async () => {
  mockGetTenantProfile.mockResolvedValue(profile('pending'));

  const { result } = renderHook(() => useFmzIdentityVerification());
  await waitFor(() => expect(result.current.kycState.status).toBe('ready'));
  expect(result.current.justVerified).toBe(false);

  const onComplete = await startAndGetOnComplete(result);
  act(() => {
    onComplete({ type: 'completed', session: { sessionId: 's1', status: 'Pending' } });
  });

  expect(result.current.justVerified).toBe(true);
  expect(result.current.justFailed).toBe(false);
});

it('short-circuits to justFailed when Didit declines client-side', async () => {
  mockGetTenantProfile.mockResolvedValue(profile('pending'));

  const { result } = renderHook(() => useFmzIdentityVerification());
  await waitFor(() => expect(result.current.kycState.status).toBe('ready'));

  const onComplete = await startAndGetOnComplete(result);
  act(() => {
    onComplete({ type: 'completed', session: { sessionId: 's1', status: 'Declined' } });
  });

  expect(result.current.justFailed).toBe(true);
  expect(result.current.justVerified).toBe(false);
});

it('surfaces a session error when the SDK reports a failure', async () => {
  mockGetTenantProfile.mockResolvedValue(profile('pending'));

  const { result } = renderHook(() => useFmzIdentityVerification());
  await waitFor(() => expect(result.current.kycState.status).toBe('ready'));

  const onComplete = await startAndGetOnComplete(result);
  act(() => {
    onComplete({ type: 'failed', error: { type: 'unknown', message: 'A câmera falhou' } });
  });

  expect(result.current.sessionState).toEqual({ status: 'error', message: 'A câmera falhou' });
});

it('asks the SDK to auto-close the modal on completion', async () => {
  mockGetTenantProfile.mockResolvedValue(profile('pending'));

  const { result } = renderHook(() => useFmzIdentityVerification());
  await waitFor(() => expect(result.current.kycState.status).toBe('ready'));

  await act(async () => {
    await result.current.startVerification();
  });

  expect(mockDiditShared.startVerification).toHaveBeenCalledWith(
    expect.objectContaining({
      configuration: expect.objectContaining({ closeModalOnComplete: true }),
    }),
  );
});

it('redirects an already-verified user on initial load', async () => {
  mockGetTenantProfile.mockResolvedValue(profile('verified'));

  const { result } = renderHook(() => useFmzIdentityVerification());

  await waitFor(() => expect(result.current.justVerified).toBe(true));
});
