'use client';

import { useEffect } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useTokenAcquisitionCelebration } from '../hooks/fmz-token-acquisition';
import { FmzTokenAcquiredCelebration } from './FmzTokenAcquiredCelebration';

const FALLBACK_PATH = '/connected/dashboard';
const WALLET_PATH   = '/connected/wallet';

/**
 * Connected route at /connected/tokens-acquired. Loads the pending celebration; if there is none
 * (e.g. already acknowledged, or opened directly), it returns the tenant to the dashboard.
 */
export function FmzTokenAcquiredCelebrationPage() {
  const router = useRouter();
  const { state, acknowledge } = useTokenAcquisitionCelebration();

  useEffect(() => {
    if (state.status === 'none' || state.status === 'error') {
      router.replace(FALLBACK_PATH);
    }
  }, [state.status, router]);

  if (state.status !== 'ready') {
    return (
      <div className="grid min-h-[40vh] place-items-center text-[13px] text-fmz-text-muted">
        Carregando…
      </div>
    );
  }

  const handleGoToWallet = async () => {
    await acknowledge();
    router.replace(WALLET_PATH);
  };

  return <FmzTokenAcquiredCelebration celebration={state.celebration} onContinue={handleGoToWallet} />;
}
