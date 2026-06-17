'use client';

import { Suspense } from 'react';
import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzVerifyEmailCard } from '../../../features/email-verification/components/FmzVerifyEmailCard';

export default function VerifyEmailPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-fmz-page text-fmz-text-primary">
      <FmzAuthHeader
        ariaLabel="Navegação da verificação de e-mail"
        contextLabel="Verificar e-mail"
        actionHref="/"
        actionLabel="Entrar"
        actionIcon={<LogIn aria-hidden="true" />}
      />
      <main className="flex min-h-0 items-center justify-center overflow-y-auto px-6 py-10 sm:py-[60px]">
        <Suspense fallback={
          <div className="w-full max-w-[480px] overflow-hidden rounded-[22px] border-[1.5px] border-fmz-border-light bg-white p-12 text-center text-sm text-fmz-text-muted shadow-[0_4px_12px_rgba(14,22,38,.06),0_20px_48px_-12px_rgba(14,22,38,.14)]">
            Carregando…
          </div>
        }>
          <FmzVerifyEmailCard />
        </Suspense>
      </main>
      <FmzPublicFooter />
    </div>
  );
}
