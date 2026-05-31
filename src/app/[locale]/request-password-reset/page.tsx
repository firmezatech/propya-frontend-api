'use client';

import { FmzPublicFooter, FmzPublicHeader } from '../../../components/layout';
import { FmzRequestPasswordResetCard } from '../../../features/password-reset/components/FmzRequestPasswordResetCard';

export default function RequestPasswordResetPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white text-fmz-text-primary">
      <FmzPublicHeader />
      <FmzRequestPasswordResetCard />
      <FmzPublicFooter />
    </div>
  );
}
