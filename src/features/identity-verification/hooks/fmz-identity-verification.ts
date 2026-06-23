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
  closeSession: () => void;
  refetchKyc: () => Promise<void>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 30; // 60 seconds total

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFmzIdentityVerification(): UseFmzIdentityVerificationReturn {
  const [kycState, setKycState] = useState<KycState>({ status: 'loading' });
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'idle' });
  const [justVerified, setJustVerified] = useState(false);
  const [justFailed, setJustFailed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  // Tracks whether we've already set the user name so refetchKyc stays stable (no userName dep).
  const userNameSetRef = useRef(false);
  // Tracks whether the Didit SDK modal is open. Read synchronously inside poll callbacks so the
  // poll keeps running while the user is verifying, even if the current KYC status is a
  // terminal value from a prior failed attempt. Refs don't trigger re-renders and are safe
  // to read inside useCallback without adding them as deps.
  const sessionOpenRef = useRef(false);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const refetchKyc = useCallback(async () => {
    setKycState({ status: 'loading' });
    try {
      const response = await getTenantProfile();
      setKycState({ status: 'ready', kycStatus: response.profile.kyc.status });
      if (!userNameSetRef.current) {
        userNameSetRef.current = true;
        setUserName(response.profile.user.fullName ?? response.profile.user.firstName ?? null);
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível carregar o status de verificação.';
      setKycState({ status: 'error', message });
    }
  }, []);

  // Polls every POLL_INTERVAL_MS. Starts once the Didit SDK reports the verification flow
  // completed (so the page updates as soon as the webhook lands — Didit's own onComplete only
  // tells us the user finished the steps, not the final Approved/Declined decision, which
  // always arrives async via webhook per docs/DIDIT_INTEGRATION_GUIDE.md). Continues while
  // status is pending or under_review — both can still resolve to verified. The 30-attempt
  // cap (60 s) guards against infinite loops when a session goes to manual review.
  const schedulePoll = useCallback(() => {
    clearPollTimer();
    pollAttemptsRef.current = 0;

    const runPoll = () => {
      if (pollAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
        clearPollTimer();
        void refetchKyc();
        return;
      }

      pollTimerRef.current = setTimeout(async () => {
        pollAttemptsRef.current += 1;
        try {
          const response = await getTenantProfile();
          const kycStatus = response.profile.kyc.status;
          setKycState({ status: 'ready', kycStatus });

          if (!userNameSetRef.current) {
            userNameSetRef.current = true;
            setUserName(response.profile.user.fullName ?? response.profile.user.firstName ?? null);
          }

          if (kycStatus === 'verified') {
            clearPollTimer();
            setJustVerified(true);
          } else if (kycStatus === 'rejected' || kycStatus === 'needs_resubmission') {
            clearPollTimer();
            setJustFailed(true);
          } else if (sessionOpenRef.current || kycStatus === 'pending' || kycStatus === 'under_review') {
            // Keep polling while a session just completed (status may still be a stale
            // terminal value from a prior attempt) or while status is genuinely transient.
            runPoll();
          } else {
            clearPollTimer();
          }
        } catch (error) {
          clearPollTimer();
          const message = error instanceof Error
            ? error.message
            : 'Não foi possível verificar o status.';
          setKycState({ status: 'error', message });
        }
      }, POLL_INTERVAL_MS);
    };

    runPoll();
  }, [clearPollTimer, refetchKyc]);

  const startVerification = useCallback(async () => {
    setSessionState({ status: 'starting' });
    setJustFailed(false);
    try {
      const session = await startDiditSession();

      // Re-assigned on every call (matches the SDK's own documented usage pattern) so the
      // callbacks always close over the current schedulePoll/setSessionState identities.
      DiditSdk.shared.onComplete = (result) => {
        if (result.type === 'completed') {
          sessionOpenRef.current = true;
          schedulePoll();
        } else if (result.type === 'failed') {
          setSessionState({ status: 'error', message: result.error?.message ?? 'A verificação falhou. Tente novamente.' });
        }
        // 'cancelled' — user closed the modal mid-flow, nothing to do, stays idle.
      };

      await DiditSdk.shared.startVerification({
        url: session.verificationUrl,
        configuration: { showCloseButton: true, showExitConfirmation: true },
      });
      setSessionState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível iniciar a sessão de verificação.';
      setSessionState({ status: 'error', message });
    }
  }, [schedulePoll]);

  const closeSession = useCallback(() => {
    DiditSdk.shared.close();
    sessionOpenRef.current = false;
  }, []);

  useEffect(() => {
    void refetchKyc();
  }, [refetchKyc]);

  useEffect(() => {
    return () => {
      clearPollTimer();
      DiditSdk.shared.destroy();
    };
  }, [clearPollTimer]);

  return { kycState, sessionState, justVerified, justFailed, userName, startVerification, closeSession, refetchKyc };
}
