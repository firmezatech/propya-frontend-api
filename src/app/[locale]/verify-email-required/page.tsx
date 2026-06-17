'use client';

import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzVerifyEmailRequiredCard } from '../../../features/email-verification/components/FmzVerifyEmailRequiredCard';

export default function VerifyEmailRequiredPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-fmz-page text-fmz-text-primary">
      <FmzAuthHeader
        ariaLabel="Navegação da confirmação de e-mail"
        contextLabel="Confirmar e-mail"
        helperText="Já tem acesso?"
        actionHref="/"
        actionLabel="Entrar"
        actionIcon={<LogIn aria-hidden="true" />}
      />
      <main className="flex min-h-0 items-center justify-center overflow-y-auto px-6 py-10 sm:py-[60px]">
        <FmzVerifyEmailRequiredCard />
      </main>
      <FmzPublicFooter />
    </div>
  );
}
