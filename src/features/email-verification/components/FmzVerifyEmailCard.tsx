'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useRouter } from '../../../i18n/navigation';
import { FmzFormAlert } from '../../api-errors/components';
import type { FmzNormalizedApiError } from '../../api-errors/domain';
import { FMZ_API_ERROR_CODES } from '../../api-errors/domain';
import { setFirmezaPostAuthRedirect } from '../../../services/auth/auth-storage';
import { verifyEmailToken } from '../services/fmz-email-verification-api';
import styles from './FmzVerifyEmailCard.module.css';

type VerifyState = 'loading' | 'success' | 'error';

const REDIRECT_TOTAL_MS = 5000;
const TICK_MS = 100;
const REDIRECT_DELAY_START_MS = 1200;

// Plain signup verification (no `redirect` param) sends the user to KYC next, since a
// freshly verified account hasn't done identity verification yet.
const DEFAULT_POST_AUTH_REDIRECT = '/connected/identity-verification';

export function FmzVerifyEmailCard() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const token       = searchParams.get('token') ?? '';
  // Lets any e-mail link reuse this same verification page but send the user somewhere
  // else after they log in (e.g. a billing page), by appending `&redirect=/connected/...`
  // to the verification URL instead of hardcoding the destination here.
  const requestedRedirect = searchParams.get('redirect') ?? '';

  const [state, setState]       = useState<VerifyState>('loading');
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [progress, setProgress]   = useState(0);
  const [countdown, setCountdown] = useState(Math.round(REDIRECT_TOTAL_MS / 1000));
  const calledRef = useRef(false);

  // Token verification — calledRef guards against StrictMode double-invocation
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    let cancelled = false;

    verifyEmailToken(token).then((result) => {
      if (cancelled) return;
      if (result.success) {
        const email = sessionStorage.getItem('ft_pending_email') ?? '';
        if (email) sessionStorage.removeItem('ft_pending_email');
        setPendingEmail(email);
        setFirmezaPostAuthRedirect(requestedRedirect || DEFAULT_POST_AUTH_REDIRECT);
        setState('success');
      } else {
        if (result.error.code === FMZ_API_ERROR_CODES.EXPIRED_EMAIL_VERIFICATION_TOKEN) {
          router.replace('/verify-email-expired');
          return;
        }
        setApiError(result.error);
        setState('error');
      }
    });

    return () => { cancelled = true; };
  }, [token]);

  // Auto-redirect countdown — starts after animations complete (1.2 s delay)
  useEffect(() => {
    if (state !== 'success') return;

    let elapsed = 0;
    let fillInterval: ReturnType<typeof setInterval> | null = null;

    const delayTimer = setTimeout(() => {
      fillInterval = setInterval(() => {
        elapsed += TICK_MS;
        setProgress((elapsed / REDIRECT_TOTAL_MS) * 100);
        setCountdown(Math.max(0, Math.ceil((REDIRECT_TOTAL_MS - elapsed) / 1000)));
        if (elapsed >= REDIRECT_TOTAL_MS) {
          clearInterval(fillInterval!);
          router.replace('/');
        }
      }, TICK_MS);
    }, REDIRECT_DELAY_START_MS);

    return () => {
      clearTimeout(delayTimer);
      if (fillInterval !== null) clearInterval(fillInterval);
    };
  }, [state, router]);

  const cardShell = 'overflow-hidden rounded-[22px] border-[1.5px] border-fmz-border-light bg-white shadow-[0_4px_12px_rgba(14,22,38,.06),0_20px_48px_-12px_rgba(14,22,38,.14)]';

  if (state === 'loading') {
    return (
      <div className={`w-full max-w-[480px] ${cardShell}`}>
        <div className="h-[5px] bg-fmz-border-light" />
        <div className="flex items-center justify-center px-8 py-16">
          <p className="text-sm text-fmz-text-muted">Verificando seu e-mail…</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <section className="w-full max-w-[480px]" aria-labelledby="fmz-verify-email-title">
        <div className={cardShell}>
          <div className="h-[5px] bg-gradient-to-r from-fmz-error to-orange-300" />
          <div className="flex flex-col items-center px-8 pb-10 pt-10 text-center sm:px-11">
            <h1
              id="fmz-verify-email-title"
              className="mb-4 text-[26px] font-extrabold tracking-[-0.03em] text-fmz-navy"
            >
              Não foi possível verificar
            </h1>
            <div className="w-full">
              <FmzFormAlert error={apiError} />
            </div>
            <button
              type="button"
              onClick={() => router.replace('/')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[13px] bg-fmz-navy px-5 py-[15px] text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(13,19,33,.18)] transition hover:-translate-y-px hover:bg-opacity-90"
            >
              <LogIn aria-hidden="true" className="h-[17px] w-[17px]" />
              Voltar para o login
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[480px]" aria-labelledby="fmz-verify-email-title">
      <div className={cardShell}>
        {/* Green accent bar */}
        <div className="h-[5px] bg-gradient-to-r from-[#0D5E3A] via-[#1A8C5B] to-[#34C985]" />

        <div className="flex flex-col items-center px-[clamp(28px,5vw,44px)] pb-[clamp(32px,4vw,44px)] pt-[clamp(36px,5vw,52px)] text-center">

          {/* Animated check with radiating rings */}
          <div className="relative mb-8 flex h-[100px] w-[100px] shrink-0 items-center justify-center">
            <div className={`${styles.ring} ${styles.ring1}`} aria-hidden="true" />
            <div className={`${styles.ring} ${styles.ring2}`} aria-hidden="true" />
            <div className={`${styles.ring} ${styles.ring3}`} aria-hidden="true" />
            <div className={styles.checkCircle}>
              <svg
                className={styles.checkmark}
                viewBox="0 0 36 36"
                aria-label="E-mail verificado"
                role="img"
              >
                <polyline points="6 18 14 26 30 10" />
              </svg>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="mb-2.5 inline-flex items-center gap-[7px] rounded-full border border-fmz-success-border bg-fmz-success-bg px-[11px] py-1 text-[11px] font-bold uppercase tracking-[.12em] text-fmz-success">
            <span className="h-1.5 w-1.5 rounded-full bg-fmz-success shadow-[0_0_0_2px_rgba(26,140,91,.2)]" aria-hidden="true" />
            E-mail verificado
          </span>

          <h1
            id="fmz-verify-email-title"
            className="mb-3 mt-2.5 text-[clamp(24px,4vw,30px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-fmz-navy"
          >
            Sua conta está ativa!
          </h1>
          <p className="mb-8 max-w-[360px] text-[14.5px] leading-[1.65] text-fmz-text-muted [text-wrap:pretty]">
            Verificamos seu endereço com sucesso. Agora você tem acesso completo à plataforma{' '}
            <strong className="font-semibold text-fmz-navy">Propya</strong> e pode começar a investir.
          </p>

          {/* Email chip — shown only when sessionStorage had the email */}
          {pendingEmail && (
            <div
              className={`${styles.slideUp1} mb-8 flex w-full items-center gap-2.5 rounded-[11px] border-[1.5px] border-fmz-success-border bg-fmz-success-bg px-4 py-2.5`}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(26,140,91,.1)] text-fmz-success"
                aria-hidden="true"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="min-w-0 flex-1 truncate text-left font-mono text-[13px] font-semibold text-[#0D5E3A]">
                {pendingEmail}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fmz-success px-2.5 py-0.5 text-[10.5px] font-bold leading-none text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Verificado
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={() => router.replace('/')}
            className={`${styles.slideUp2} flex w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-fmz-gold-dark bg-fmz-gold px-5 py-[15px] text-[15px] font-bold text-fmz-navy shadow-[0_4px_14px_rgba(245,200,66,.35)] transition hover:-translate-y-px hover:brightness-95 hover:shadow-[0_8px_24px_rgba(245,200,66,.45)]`}
          >
            <LogIn aria-hidden="true" className="h-[17px] w-[17px]" />
            Ir para o login
          </button>

          {/* Auto-redirect progress bar */}
          <div className={`${styles.slideUp3} mt-4 w-full`} aria-live="polite" aria-atomic="true">
            <p className="mb-1.5 flex items-center justify-center gap-1 text-[12.5px] text-fmz-text-hint">
              Redirecionando automaticamente em{' '}
              <span className="font-mono text-[12px] font-semibold text-fmz-text-muted">
                {countdown}s
              </span>…
            </p>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-fmz-border-light" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-fmz-success to-fmz-gold transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
