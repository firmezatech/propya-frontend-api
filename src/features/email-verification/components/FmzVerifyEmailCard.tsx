'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '../../../i18n/navigation';
import { FmzBrandMark } from '../../../components/layout';
import { FmzButton } from '../../../components/design-system';
import { FmzFormAlert } from '../../api-errors/components';
import type { FmzNormalizedApiError } from '../../api-errors/domain';
import { verifyEmailToken } from '../services/fmz-email-verification-api';

type VerifyState = 'loading' | 'success' | 'error';

const REDIRECT_DELAY_MS = 3000;

export function FmzVerifyEmailCard() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const token       = searchParams.get('token') ?? '';

  const [state, setState]   = useState<VerifyState>('loading');
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    verifyEmailToken(token).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setState('success');
        redirectTimer = setTimeout(() => router.replace('/'), REDIRECT_DELAY_MS);
      } else {
        setApiError(result.error);
        setState('error');
      }
    });

    return () => {
      cancelled = true;
      if (redirectTimer !== null) clearTimeout(redirectTimer);
    };
  }, [token, router]);

  return (
    <section className="w-full max-w-[440px]" aria-labelledby="fmz-verify-email-title">
      <div className="mb-10 text-center">
        <FmzBrandMark size="form" className="mb-7" />
        <h1 id="fmz-verify-email-title" className="mb-2 font-sans text-[26px] font-extrabold tracking-[-0.025em] text-fmz-navy">
          {state === 'success' ? 'E-mail confirmado!' : 'Verificando seu e-mail'}
        </h1>
        <p className="text-sm text-fmz-text-muted">
          {state === 'loading' && 'Aguarde enquanto confirmamos seu endereço de e-mail…'}
          {state === 'success' && 'Sua conta está ativa. Redirecionando para o login em instantes.'}
          {state === 'error'   && 'Não foi possível confirmar seu e-mail.'}
        </p>
      </div>

      <div className="rounded-2xl border-[1.5px] border-fmz-border-light bg-white px-6 py-8 sm:px-10 sm:py-9">
        {state === 'loading' && (
          <p className="text-center text-sm text-fmz-text-muted">Verificando…</p>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="text-sm text-fmz-text-muted">Você será redirecionada para o login automaticamente.</p>
            <FmzButton type="button" variant="primary" onClick={() => router.replace('/')}>
              Ir para o login agora
            </FmzButton>
          </div>
        )}

        {state === 'error' && (
          <>
            <FmzFormAlert error={apiError} />
            <FmzButton type="button" variant="primary" onClick={() => router.replace('/')}>
              Voltar para o login
            </FmzButton>
          </>
        )}
      </div>
    </section>
  );
}
