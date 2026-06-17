'use client';

import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzVerifyEmailExpiredCard } from '../../../features/email-verification/components/FmzVerifyEmailExpiredCard';

export default function VerifyEmailExpiredPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-fmz-page text-fmz-text-primary">
      <FmzAuthHeader
        ariaLabel="Navegação do link expirado"
        contextLabel="Link expirado"
        actionHref="/"
        actionLabel="Entrar"
        actionIcon={<LogIn aria-hidden="true" />}
      />
      <main className="flex min-h-0 items-center justify-center overflow-y-auto px-6 py-10 sm:py-[60px]">
        <FmzVerifyEmailExpiredCard />
      </main>
      <FmzPublicFooter />
    </div>
  );
}
