'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DiditSdk } from '@didit-protocol/sdk-web';
import { getTenantProfile } from '../../tenant-portal/services/fmz-tenant-profile-api';
import { startDiditSession } from '../services/fmz-identity-verification-api';
import type { TenantKycStatus } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── State shapes ─────────────────────────────────────────────────────────────

type KycState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; kycStatus: TenantKycStatus };

// The SDK owns its own modal UI (it embeds Didit's hosted flow correctly — see
// node_modules/@didit-protocol/sdk-web — a plain <iframe src={verificationUrl}> doesn't
// work because Didit's hosted page won't render itself inside an unmanaged frame). 'starting'
// only covers our own POST /kyc/didit/start round trip, not the multi-step verification flow.
type SessionState =
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'error'; message: string };

// ─── Hook return ──────────────────────────────────────────────────────────────

export type UseFmzIdentityVerificationReturn = {
  kycState: KycState;
  sessionState: SessionState;
  justVerified: boolean;
  justFailed: boolean;
  userName: string | null;
  startVerification: () => Promise<void>;
  refetchKyc: () => Promise<void>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzIdentityVerification(): UseFmzIdentityVerificationReturn {
  const [kycState, setKycState] = useState<KycState>({ status: 'loading' });
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'idle' });
  const [justVerified, setJustVerified] = useState(false);
  const [justFailed, setJustFailed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Tracks whether we've already set the user name so refetchKyc stays stable (no userName dep).
  const userNameSetRef = useRef(false);

  // Maps a freshly fetched KYC status onto the terminal-outcome flags. Used on initial load
  // so already-verified users are redirected without re-verifying.
  const applyKycStatus = useCallback((kycStatus: TenantKycStatus): void => {
    if (kycStatus === 'verified') {
      setJustVerified(true);
    } else if (kycStatus === 'rejected' || kycStatus === 'needs_resubmission') {
      setJustFailed(true);
    }
  }, []);

  const refetchKyc = useCallback(async () => {
    setKycState({ status: 'loading' });
    try {
      const response = await getTenantProfile();
      const kycStatus = response.profile.kyc.status;
      setKycState({ status: 'ready', kycStatus });
      if (!userNameSetRef.current) {
        userNameSetRef.current = true;
        setUserName(response.profile.user.fullName ?? response.profile.user.firstName ?? null);
      }
      applyKycStatus(kycStatus);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível carregar o status de verificação.';
      setKycState({ status: 'error', message });
    }
  }, [applyKycStatus]);

  const startVerification = useCallback(async () => {
    setSessionState({ status: 'starting' });
    setJustFailed(false);
    setJustVerified(false);
    try {
      const session = await startDiditSession();

      DiditSdk.shared.onComplete = (result) => {
        if (result.type === 'completed') {
          if (result.session?.status === 'Declined') {
            setJustFailed(true);
            return;
          }
          setJustVerified(true);
        } else if (result.type === 'failed') {
          setSessionState({ status: 'error', message: result.error?.message ?? 'A verificação falhou. Tente novamente.' });
        }
        // 'cancelled' — user closed the modal mid-flow, nothing to do.
      };

      await DiditSdk.shared.startVerification({
        url: session.verificationUrl,
        // closeModalOnComplete: true — SDK auto-closes the overlay the instant didit:completed
        // fires, so our onComplete('completed') callback always runs before any user-triggered
        // close can race it or show a misleading "your progress will be lost" exit dialog.
        configuration: { showCloseButton: true, showExitConfirmation: true, closeModalOnComplete: true },
      });
      setSessionState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível iniciar a sessão de verificação.';
      setSessionState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    void refetchKyc();
  }, [refetchKyc]);

  useEffect(() => {
    return () => {
      DiditSdk.shared.destroy();
    };
  }, []);

  return { kycState, sessionState, justVerified, justFailed, userName, startVerification, refetchKyc };
}
