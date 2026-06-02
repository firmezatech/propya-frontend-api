'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  acknowledgeTokenAcquisitionCelebration,
  getPendingTokenAcquisitionCelebration,
} from '../services/fmz-token-acquisition-api';
import type { TokenAcquisitionCelebration } from '../domain/fmz-token-acquisition.types';

type CelebrationState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'ready'; notificationId: string; celebration: TokenAcquisitionCelebration }
  | { status: 'error' };

/**
 * Loads the tenant's pending token-acquisition celebration (if any) and exposes an
 * `acknowledge` action that marks it read so it is only shown once.
 */
export function useTokenAcquisitionCelebration() {
  const [state, setState] = useState<CelebrationState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getPendingTokenAcquisitionCelebration()
      .then((pending) => {
        if (!active) return;
        setState(pending
          ? { status: 'ready', notificationId: pending.notificationId, celebration: pending.celebration }
          : { status: 'none' });
      })
      .catch(() => active && setState({ status: 'error' }));
    return () => { active = false; };
  }, []);

  const acknowledge = useCallback(async () => {
    if (state.status !== 'ready') return;
    try {
      await acknowledgeTokenAcquisitionCelebration(state.notificationId);
    } catch {
      // Non-fatal: the page still shows; the notification simply stays unread for a retry.
    }
  }, [state]);

  return { state, acknowledge };
}
