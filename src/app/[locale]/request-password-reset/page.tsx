'use client';

import { FmzPublicPageShell } from '../../../components/layout';
import { FmzRequestPasswordResetCard } from '../../../features/password-reset/components/FmzRequestPasswordResetCard';

export default function RequestPasswordResetPage() {
  return (
    <FmzPublicPageShell>
      <FmzRequestPasswordResetCard />
    </FmzPublicPageShell>
  );
}
