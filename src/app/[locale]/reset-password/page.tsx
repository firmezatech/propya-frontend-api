'use client';

import { Suspense } from 'react';
import { LogIn } from 'lucide-react';
import { FmzAuthHeader, FmzPublicFooter } from '../../../components/layout';
import { FmzResetPasswordCard } from '../../../features/password-reset/components/FmzResetPasswordCard';

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-white text-fmz-text-primary">
      <FmzAuthHeader
        ariaLabel="Navegação da redefinição de senha"
        contextLabel="Redefinir senha"
        helperText="Lembrou a senha?"
        actionHref="/"
        actionLabel="Entrar"
        actionIcon={<LogIn aria-hidden="true" />}
      />
      <main className="flex min-h-0 items-center justify-center overflow-y-auto bg-white px-6 py-10 sm:py-[60px]">
        <Suspense fallback={<p className="text-sm text-fmz-text-muted">Carregando...</p>}>
          <FmzResetPasswordCard />
        </Suspense>
      </main>
      <FmzPublicFooter />
    </div>
  );
}
