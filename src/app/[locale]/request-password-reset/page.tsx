'use client';

import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzRequestPasswordResetCard } from '../../../features/password-reset/components/FmzRequestPasswordResetCard';

export default function RequestPasswordResetPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white text-fmz-text-primary">
      <FmzAuthHeader
        ariaLabel="Navegação da recuperação de senha"
        contextLabel="Recuperar senha"
        helperText="Lembrou a senha?"
        actionHref="/"
        actionLabel="Entrar"
        actionIcon={<LogIn aria-hidden="true" />}
      />
      <FmzRequestPasswordResetCard />
      <FmzPublicFooter />
    </div>
  );
}
