'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getTenantProfile } from '../../tenant-portal/services/fmz-tenant-profile-api';
import { startDiditSession } from '../services/fmz-identity-verification-api';
import type { TenantKycStatus } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── State shapes ─────────────────────────────────────────────────────────────

type KycState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; kycStatus: TenantKycStatus };

type SessionState =
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'open'; verificationUrl: string }
  | { status: 'error'; message: string };

// ─── Hook return ──────────────────────────────────────────────────────────────

export type UseFmzIdentityVerificationReturn = {
  kycState: KycState;
  sessionState: SessionState;
  justVerified: boolean;
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
  const [userName, setUserName] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  // Tracks whether we've already set the user name so refetchKyc stays stable (no userName dep).
  const userNameSetRef = useRef(false);

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
        setUserName(response.profile.user.firstName ?? null);
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível carregar o status de verificação.';
      setKycState({ status: 'error', message });
    }
  }, []);

  // Polls every POLL_INTERVAL_MS after the Didit session closes. Didit's webhook reaches
  // the backend within a few seconds; we poll until verified, another terminal state,
  // or POLL_MAX_ATTEMPTS is exceeded. runPoll lives inside schedulePoll so each invocation
  // creates a fresh closure — safe to call again without stale state.
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
            setUserName(response.profile.user.firstName ?? null);
          }

          if (kycStatus === 'verified') {
            clearPollTimer();
            setJustVerified(true);
          } else if (kycStatus === 'pending') {
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
    try {
      const session = await startDiditSession();
      setSessionState({ status: 'open', verificationUrl: session.verificationUrl });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível iniciar a sessão de verificação.';
      setSessionState({ status: 'error', message });
    }
  }, []);

  const closeSession = useCallback(() => {
    setSessionState({ status: 'idle' });
    schedulePoll();
  }, [schedulePoll]);

  useEffect(() => {
    void refetchKyc();
  }, [refetchKyc]);

  useEffect(() => {
    return () => clearPollTimer();
  }, [clearPollTimer]);

  return { kycState, sessionState, justVerified, userName, startVerification, closeSession, refetchKyc };
}
