'use client';

import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import { Link } from '../../../i18n/navigation';
import styles from './FmzVerifyEmailRequiredCard.module.css';

export function FmzVerifyEmailRequiredCard() {
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    setPendingEmail(sessionStorage.getItem('ft_pending_email') ?? '');
  }, []);

  return (
    <section className="w-full max-w-[480px]" aria-labelledby="fmz-verify-required-title">
      <div className="overflow-hidden rounded-[22px] border-[1.5px] border-fmz-border-light bg-white shadow-[0_4px_12px_rgba(14,22,38,.06),0_20px_48px_-12px_rgba(14,22,38,.14)]">

        {/* Gold accent bar */}
        <div className="h-[5px] bg-gradient-to-r from-[#8A6B12] via-fmz-gold to-[#F5D26B]" />

        <div className="flex flex-col items-center px-[clamp(28px,5vw,44px)] pb-[clamp(32px,4vw,44px)] pt-[clamp(32px,5vw,48px)] text-center">

          {/* Animated envelope — flex centering ensures SVG is centered vertically */}
          <div
            className={`${styles.envelopeWrap} mb-7 flex items-center justify-center rounded-3xl border-[1.5px] border-[rgba(232,182,32,.25)] bg-[#FBF3DA]`}
            aria-hidden="true"
          >
            <div className={`${styles.dot} ${styles.dot1}`} />
            <div className={`${styles.dot} ${styles.dot2}`} />
            <div className={`${styles.dot} ${styles.dot3}`} />
            <svg
              className={`${styles.envelopeIcon} h-11 w-11`}
              viewBox="0 0 44 44"
              fill="none"
            >
              <rect x="4" y="10" width="36" height="26" rx="4" fill="rgba(232,182,32,.15)" stroke="#8A6B12" strokeWidth="2"/>
              <path d="M4 14l18 12 18-12" stroke="#8A6B12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="33" cy="12" r="7" fill="#E8B620" stroke="white" strokeWidth="2"/>
              <path d="M30 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1
            id="fmz-verify-required-title"
            className="mb-2.5 text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em] text-fmz-navy"
          >
            Confirme seu e-mail
          </h1>
          <p className="mb-6 max-w-[360px] text-[14px] leading-[1.6] text-fmz-text-muted [text-wrap:pretty]">
            Enviamos um link de verificação para o endereço abaixo. Clique nele para ativar sua conta e ter acesso à plataforma.
          </p>

          {/* Email chip */}
          <div className="mb-7 flex w-full items-center justify-between gap-2.5 rounded-[11px] border-[1.5px] border-fmz-border-light bg-fmz-input px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(232,182,32,.2)] bg-[#FBF3DA] text-[#8A6B12]" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="min-w-0 truncate font-mono text-[13px] font-semibold text-fmz-navy">
                {pendingEmail || 'verifique seu e-mail'}
              </span>
            </div>
            <span className="shrink-0 text-[10.5px] font-bold uppercase tracking-[.04em] text-fmz-text-hint">
              Pendente
            </span>
          </div>

          {/* Steps */}
          <ol className="mb-7 flex w-full flex-col gap-2.5 text-left" aria-label="Passos para confirmar o e-mail">
            {[
              { title: 'Abra seu e-mail', desc: 'Acesse a caixa de entrada do endereço cadastrado acima.' },
              { title: 'Clique em "Confirmar e-mail"', desc: 'O link é válido por 60 minutos a partir do envio.' },
              { title: 'Pronto — acesse a plataforma', desc: 'Após confirmar, você será redirecionado automaticamente.' },
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-[11px] border border-fmz-border-light bg-fmz-input px-3.5 py-3"
              >
                <span
                  className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fmz-navy text-[11px] font-bold text-white"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-fmz-navy">{step.title}</p>
                  <p className="text-[12px] leading-[1.5] text-fmz-text-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Resend note — button disabled until backend endpoint is available */}
          <div className="mb-1 flex flex-wrap items-center justify-center gap-1.5 text-[13px] text-fmz-text-muted">
            <span>Não recebeu?</span>
            <span className="font-semibold text-fmz-text-hint">
              Verifique o spam ou faça login para solicitar um novo link.
            </span>
          </div>

          <div className="my-6 h-px w-full bg-fmz-border-light" aria-hidden="true" />

          {/* Spam note */}
          <div className="flex w-full items-start gap-2.5 rounded-[10px] border border-[rgba(37,99,235,.15)] bg-[#EFF4FE] p-3 text-left">
            <svg
              className="mt-px h-[15px] w-[15px] shrink-0 text-fmz-blue"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[12px] leading-[1.5] text-fmz-blue">
              <strong className="font-bold">Não encontrou?</strong>{' '}
              Verifique sua pasta de spam ou lixo eletrônico. Às vezes os filtros de e-mail redirecionam mensagens automáticas.
            </p>
          </div>

          {/* Login link */}
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-fmz-text-muted no-underline transition hover:text-fmz-navy"
          >
            <LogIn aria-hidden="true" className="h-3.5 w-3.5" />
            Já verificou? Entrar na plataforma
          </Link>

        </div>
      </div>
    </section>
  );
}
