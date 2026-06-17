'use client';

import { useEffect, useRef, useState } from 'react';
import { LogIn, RefreshCw } from 'lucide-react';
import { useRouter } from '../../../i18n/navigation';
import { resendVerificationEmail } from '../services/fmz-email-verification-api';
import styles from './FmzVerifyEmailExpiredCard.module.css';

const COOLDOWN_S = 60;
const TOAST_DURATION_MS = 3500;

type SendState = 'idle' | 'sending' | 'sent' | 'error';
type ToastPhase = 'hidden' | 'enter' | 'exit';

export function FmzVerifyEmailExpiredCard() {
  const router = useRouter();

  const [email, setEmail]             = useState('');
  const [hasStoredEmail, setHasStoredEmail] = useState(false);
  const [hydrated, setHydrated]       = useState(false);
  const [sendState, setSendState]     = useState<SendState>('idle');
  const [cooldown, setCooldown]       = useState(0);
  const [toastPhase, setToastPhase]   = useState<ToastPhase>('hidden');

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('ft_pending_email') ?? '';
    setEmail(stored);
    setHasStoredEmail(Boolean(stored));
    setHydrated(true);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (toastRef.current)    clearTimeout(toastRef.current);
    };
  }, []);

  const handleResend = async () => {
    const target = email.trim();
    if (!target || sendState === 'sending' || cooldown > 0) return;

    setSendState('sending');
    const result = await resendVerificationEmail(target);

    if (result.success) {
      setSendState('sent');
      setCooldown(COOLDOWN_S);

      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current!);
            cooldownRef.current = null;
            setSendState('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setToastPhase('enter');
      if (toastRef.current) clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => {
        setToastPhase('exit');
        toastRef.current = setTimeout(() => setToastPhase('hidden'), 280);
      }, TOAST_DURATION_MS);
    } else {
      setSendState('error');
      setTimeout(() => setSendState('idle'), 3000);
    }
  };

  const isSending  = sendState === 'sending';
  const canResend  = email.trim().length > 0 && !isSending && cooldown === 0;

  return (
    <>
      <section className="w-full max-w-[480px]" aria-labelledby="fmz-expired-title">
        <div className="overflow-hidden rounded-[22px] border-[1.5px] border-fmz-border-light bg-white shadow-[0_4px_12px_rgba(14,22,38,.06),0_20px_48px_-12px_rgba(14,22,38,.14)]">

          {/* Red accent bar */}
          <div className="h-[5px] bg-gradient-to-r from-[#8C2418] via-[#B23B2D] to-[#E8735A]" />

          <div className="flex flex-col items-center px-[clamp(28px,5vw,44px)] pb-[clamp(32px,4vw,44px)] pt-[clamp(36px,5vw,52px)] text-center">

            {/* Animated clock icon with X badge */}
            <div
              className={`${styles.iconWrap} relative mb-7 flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-3xl border-[1.5px] border-[#F5C4BF] bg-[#FBEDEB]`}
            >
              <span className="absolute -right-[6px] -top-[6px] flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] border-white bg-[#B23B2D]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </span>
              <svg
                className="h-[46px] w-[46px] text-[#B23B2D]"
                viewBox="0 0 24 24"
                fill="none"
                aria-label="Relógio — link expirado"
                role="img"
              >
                <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8"/>
                <line className={styles.clockHour}   x1="12" y1="12" x2="12"   y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line className={styles.clockMinute} x1="12" y1="12" x2="15.5" y2="12"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
              </svg>
            </div>

            {/* Eyebrow */}
            <span className="mb-2.5 inline-flex items-center gap-[7px] rounded-full border border-[#F5C4BF] bg-[#FBEDEB] px-[11px] py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#B23B2D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B23B2D]" aria-hidden="true" />
              Link expirado
            </span>

            <h1
              id="fmz-expired-title"
              className="mb-3 mt-2.5 text-[clamp(22px,4vw,28px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-fmz-navy"
            >
              Este link não é mais válido
            </h1>
            <p className="mb-7 max-w-[360px] text-[14px] leading-[1.65] text-fmz-text-muted [text-wrap:pretty]">
              O link de verificação que você clicou{' '}
              <strong className="font-semibold text-fmz-navy">expirou após 60 minutos</strong>.
              Por segurança, cada link é de uso único e tem prazo limitado.
            </p>

            {/* Info box */}
            <div className={`${styles.slideUp1} mb-7 flex w-full items-start gap-[11px] rounded-[12px] border-[1.5px] border-[rgba(196,122,10,.25)] bg-[#FBF3DA] px-4 py-3.5 text-left`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(196,122,10,.12)] text-[#C47A0A]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <p className="mb-0.5 text-[13px] font-bold text-fmz-navy">O que aconteceu?</p>
                <p className="text-[12.5px] leading-[1.55] text-fmz-text-muted">
                  Links de verificação expiram em{' '}
                  <strong className="font-semibold text-[#C47A0A]">60 minutos</strong>{' '}
                  por segurança. Solicite um novo abaixo — ele chegará em instantes.
                </p>
              </div>
            </div>

            {/* Email chip (stored) or email input (unknown) */}
            {hydrated && hasStoredEmail && (
              <div className={`${styles.slideUp1} mb-5 flex w-full items-center justify-between gap-2.5 rounded-[11px] border-[1.5px] border-fmz-border-light bg-fmz-input px-4 py-2.5`}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FBEDEB] text-[#B23B2D]" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <span className="min-w-0 truncate font-mono text-[13px] font-semibold text-fmz-navy">
                    {email}
                  </span>
                </div>
                <span className="shrink-0 text-[10.5px] font-bold uppercase tracking-[.04em] text-fmz-text-hint">
                  Expirado
                </span>
              </div>
            )}
            {hydrated && !hasStoredEmail && (
              <div className={`${styles.slideUp1} mb-5 w-full`}>
                <label htmlFor="fmz-resend-email" className="mb-1.5 block text-left text-[12.5px] font-semibold text-fmz-text-muted">
                  Seu e-mail
                </label>
                <input
                  id="fmz-resend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={cooldown > 0}
                  className="w-full rounded-[11px] border-[1.5px] border-fmz-border-light bg-fmz-input px-4 py-[11px] font-mono text-[13px] text-fmz-navy placeholder:text-fmz-text-hint focus:border-fmz-navy focus:outline-none disabled:opacity-60"
                />
              </div>
            )}

            {/* Resend CTA */}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              aria-live="polite"
              className={`${styles.slideUp2} mb-[10px] flex w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-fmz-gold-dark bg-fmz-gold px-5 py-[14px] text-[15px] font-bold text-fmz-navy shadow-[0_4px_14px_rgba(245,200,66,.3)] transition hover:-translate-y-px hover:brightness-95 hover:shadow-[0_8px_24px_rgba(245,200,66,.42)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:hover:shadow-[0_4px_14px_rgba(245,200,66,.3)]`}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`} />
              {isSending  ? 'Enviando…'
               : cooldown > 0 ? `Aguarde ${cooldown}s`
               : 'Reenviar link de verificação'}
            </button>

            {/* Back to login */}
            <button
              type="button"
              onClick={() => router.replace('/')}
              className={`${styles.slideUp3} flex w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-fmz-border-light bg-white px-5 py-[13px] text-[14px] font-semibold text-fmz-navy transition hover:-translate-y-px hover:border-fmz-navy hover:bg-fmz-input`}
            >
              <LogIn aria-hidden="true" className="h-[15px] w-[15px] text-fmz-text-muted" />
              Voltar para o login
            </button>

            {/* Resend hint / countdown */}
            <p className={`${styles.slideUp4} mt-4 flex flex-wrap items-center justify-center gap-[5px] text-[12.5px] text-fmz-text-hint`}>
              {cooldown > 0 ? (
                <>
                  <span>Aguarde para reenviar novamente.</span>
                  <span className="rounded-[6px] border border-[rgba(232,182,32,.3)] bg-[#FBF3DA] px-[7px] py-[2px] font-mono text-[12px] font-semibold text-[#8A6B12]">
                    {cooldown}s
                  </span>
                </>
              ) : (
                <span>
                  {hasStoredEmail
                    ? `Reenviaremos para ${email}.`
                    : 'Reenviaremos para o e-mail informado.'}
                </span>
              )}
            </p>

            {/* Inline error */}
            {sendState === 'error' && (
              <p className="mt-2 text-[12.5px] text-fmz-error" role="alert">
                Não foi possível enviar. Tente novamente.
              </p>
            )}

          </div>
        </div>
      </section>

      {/* Toast — fixed, outside card */}
      {toastPhase !== 'hidden' && (
        <div
          className={`${styles.toast} ${toastPhase === 'enter' ? styles.toastEnter : styles.toastExit}`}
          role="status"
          aria-live="polite"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Novo link enviado! Verifique sua caixa de entrada.
        </div>
      )}
    </>
  );
}
