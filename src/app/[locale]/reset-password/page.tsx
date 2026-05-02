'use client';

import { Suspense } from 'react';
import { FmzPublicPageShell } from '../../../components/layout';
import { FmzResetPasswordCard } from '../../../features/password-reset/components/FmzResetPasswordCard';

export default function ResetPasswordPage() {
  return (
    <FmzPublicPageShell>
      <Suspense fallback={<p className="text-sm text-fmz-text-muted">Carregando...</p>}>
        <FmzResetPasswordCard />
      </Suspense>
    </FmzPublicPageShell>
  );
}
