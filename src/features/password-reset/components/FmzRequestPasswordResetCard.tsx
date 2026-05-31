'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, MailCheck, Send, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { Link } from '../../../i18n/navigation';
import { FmzButton } from '../../../components/design-system';
import { FmzEmailInput } from './FmzEmailInput';
import { FmzFormAlert } from '../../api-errors/components';
import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import { FMZ_API_ERROR_CODES, type FmzFieldErrorMap, type FmzNormalizedApiError } from '../../api-errors/domain';
import { getFmzPasswordResetConfig, requestPasswordReset } from '../services/fmz-password-reset-api';
import { buildFmzRequestPasswordResetSchema } from '../domain/fmz-password-reset-validation';

const RESEND_COOLDOWN_SECONDS = 30;

const RECOVERY_STEPS = [
  { title: 'Informe seu e-mail', description: 'O mesmo que você usa para entrar na FirmezaToken.' },
  { title: 'Receba o link seguro', description: 'Enviado na hora — válido por 30 minutos.' },
  { title: 'Crie uma nova senha', description: 'E volte a acompanhar a sua carteira.' },
] as const;

const SUCCESS_STEPS = [
  <>Abra o e-mail de <b className="font-semibold text-fmz-navy">FirmezaToken</b> e toque em <b className="font-semibold text-fmz-navy">“Redefinir senha”</b>.</>,
  <>O link é válido por <b className="font-semibold text-fmz-navy">30 minutos</b> e pode ser usado uma única vez.</>,
  <>Não encontrou? Verifique a caixa de <b className="font-semibold text-fmz-navy">spam</b> ou promoções.</>,
] as const;

const buildValidationError = (error: z.ZodError): { fieldErrors: FmzFieldErrorMap; alertError: FmzNormalizedApiError } => {
  const emailMessage = error.errors[0]?.message || 'Informe um e-mail válido.';

  return {
    fieldErrors: { email: emailMessage },
    alertError: {
      code: FMZ_API_ERROR_CODES.VALIDATION_ERROR,
      title: 'Revise o e-mail informado',
      description: emailMessage,
      severity: 'error',
      fieldErrors: { email: emailMessage },
    },
  };
};

export function FmzRequestPasswordResetCard() {
  const authAccessConfig = useMemo(() => getFmzPasswordResetConfig(), []);
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FmzFieldErrorMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const isSuccess = Boolean(submittedEmail);
  const isResendCoolingDown = resendCooldown > 0;

  // Run a single 1s ticker while the cooldown is active. Depending on the
  // boolean (not the seconds value) keeps the interval alive for the whole
  // countdown instead of recreating it on every tick.
  useEffect(() => {
    if (!isResendCoolingDown) return;

    const intervalId = setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isResendCoolingDown]);

  // Shared request used by the initial submit and the "resend" action. Keeps a
  // single source of truth for the backend integration and its error handling.
  const sendRecoveryEmail = async (email: string) => {
    setApiError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({ email });

      if (!response.success) {
        setApiError(response.error);
        setFieldErrors(response.error.fieldErrors);
        return false;
      }

      setSuccessMessage(response.message);
      setSubmittedEmail(email);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setFieldErrors({});

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const payload = buildFmzRequestPasswordResetSchema().parse(formData);
      await sendRecoveryEmail(payload.email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = buildValidationError(error);
        setApiError(validationError.alertError);
        setFieldErrors(validationError.fieldErrors);
      }
    }
  };

  const handleResend = async () => {
    if (isResendCoolingDown || isSubmitting || !submittedEmail) return;
    await sendRecoveryEmail(submittedEmail);
  };

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2" aria-labelledby="fmz-request-password-reset-title">
      {/* ── LEFT: brand panel ─────────────────────────────────────── */}
      <aside className="relative flex flex-col justify-center gap-8 overflow-hidden border-b border-fmz-border-light bg-gradient-to-b from-[#FBF7EE] to-[#F4EEDF] px-6 py-12 sm:px-10 lg:items-end lg:border-b-0 lg:border-r lg:py-16 lg:pl-14 lg:pr-[clamp(48px,6vw,92px)]">
        {/* faint dotted grid, masked toward the top-left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(13,19,33,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,19,33,0.04) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
            maskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at 30% 40%, black 0%, transparent 80%)',
          }}
        />
        {/* gold radial glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 110% -10%, rgba(245,200,66,0.22) 0%, transparent 60%), radial-gradient(50% 50% at -10% 110%, rgba(245,200,66,0.10) 0%, transparent 60%)',
          }}
        />
        {/* geometric mark, bottom-right */}
        <svg
          aria-hidden="true"
          width="540"
          height="540"
          viewBox="0 0 500 500"
          fill="none"
          className="pointer-events-none absolute -bottom-24 -right-20 text-fmz-navy opacity-[0.08]"
        >
          <path d="M250 50L450 175V325L250 450L50 325V175L250 50Z" stroke="currentColor" strokeWidth="1" />
          <path d="M250 50L250 450M50 175L450 325M450 175L50 325" stroke="currentColor" strokeWidth=".5" />
          <path d="M250 130L370 205V305L250 380L130 305V205L250 130Z" stroke="currentColor" strokeWidth="1" />
          <path d="M250 210L310 245V295L250 330L190 295V245L250 210Z" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="relative w-full lg:max-w-[480px]">
          <span className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fmz-gold-dark">
            <span className="h-[1.5px] w-[18px] rounded-full bg-fmz-gold" />
            Recuperação de acesso
          </span>
          <h2 className="mb-5 max-w-[480px] font-sans text-[clamp(30px,3.4vw,44px)] font-extrabold leading-[1.05] tracking-[-0.035em] text-fmz-navy">
            Sem pânico.<br />
            Vamos{' '}
            <span className="bg-gradient-to-br from-fmz-gold-dark to-fmz-gold bg-clip-text text-transparent">
              recuperar
            </span>
            <br />
            o seu acesso.
          </h2>
          <p className="max-w-[420px] text-[14.5px] leading-relaxed text-fmz-text-muted">
            Informe o e-mail cadastrado e enviaremos um link seguro para você criar uma nova senha. Seu patrimônio
            tokenizado continua protegido o tempo todo.
          </p>

          <div className="mt-9 rounded-2xl border border-fmz-border-light bg-white/65 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-fmz-gold shadow-[0_0_0_3px_rgba(245,200,66,0.25)]" />
              <span className="text-xs font-semibold text-fmz-navy">Como funciona a recuperação</span>
            </div>
            <ol className="space-y-4">
              {RECOVERY_STEPS.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3.5">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border-[1.5px] font-sans text-[13px] font-bold ${
                      index === 0
                        ? 'border-fmz-gold bg-fmz-gold text-fmz-navy shadow-[0_4px_12px_rgba(245,200,66,0.35)]'
                        : 'border-fmz-border-light bg-white text-fmz-text-muted'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className="block text-[13px] font-semibold text-fmz-navy">{step.title}</span>
                    <span className="block text-[11.5px] leading-snug text-fmz-text-muted">{step.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-fmz-border-light bg-white/55 px-4 py-3.5 text-[12.5px] leading-relaxed text-fmz-text-muted">
            <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-fmz-gold-dark" aria-hidden="true" />
            <span>
              <b className="font-semibold text-fmz-navy">Nunca pedimos sua senha por e-mail ou telefone.</b> O link de
              recuperação leva apenas para o domínio oficial da FirmezaToken.
            </span>
          </div>
        </div>

        <div className="relative flex w-full items-center gap-2.5 border-t border-fmz-border-light pt-6 text-[11px] font-medium tracking-[0.02em] text-fmz-text-muted lg:max-w-[480px]">
          <Lock className="h-3.5 w-3.5 text-fmz-gold-dark" aria-hidden="true" />
          Criptografia ponta-a-ponta · LGPD
        </div>
      </aside>

      {/* ── RIGHT: form / success column ──────────────────────────── */}
      <section className="flex flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:py-16 lg:pl-[clamp(48px,6vw,92px)] lg:pr-14">
        <div className="w-full max-w-[440px]">
          {isSuccess ? (
            <div className="animate-[fmzFadeIn_0.3s_ease]">
              <span className="mb-6 grid h-16 w-16 place-items-center rounded-[18px] border-[1.5px] border-fmz-success-border bg-fmz-success-bg text-fmz-success">
                <MailCheck className="h-8 w-8" aria-hidden="true" />
              </span>
              <h1
                id="fmz-request-password-reset-title"
                className="mb-2.5 font-sans text-[clamp(24px,3vw,30px)] font-bold tracking-[-0.035em] text-fmz-navy"
              >
                Verifique seu e-mail
              </h1>
              <p className="mb-2 text-[13.5px] leading-relaxed text-fmz-text-muted">
                {successMessage || 'Se houver uma conta associada, enviamos um link de recuperação para:'}
              </p>
              <span className="my-2 inline-flex items-center gap-2.5 rounded-xl border border-fmz-border-light bg-[#FBF7EE] px-3.5 py-2.5 text-[13px] font-semibold text-fmz-navy">
                <Mail className="h-3.5 w-3.5 text-fmz-gold-dark" aria-hidden="true" />
                <span className="break-all">{submittedEmail}</span>
              </span>

              <ol className="my-6 space-y-3 rounded-2xl border border-fmz-border-light bg-fmz-page p-5">
                {SUCCESS_STEPS.map((content, index) => (
                  <li key={index} className="flex items-start gap-3 text-[12.5px] leading-snug text-fmz-text-muted">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#FBF3DA] font-sans text-[11px] font-bold text-fmz-gold-dark">
                      {index + 1}
                    </span>
                    <span>{content}</span>
                  </li>
                ))}
              </ol>

              <Link
                href={fmzPublicLayoutConfig.homePath}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-fmz-gold bg-fmz-gold px-4 py-3.5 font-sans text-sm font-bold uppercase tracking-[0.05em] text-fmz-navy no-underline transition hover:-translate-y-0.5 hover:bg-[#F5D26B] hover:shadow-[0_8px_22px_rgba(245,200,66,0.4)]"
              >
                Voltar para o login
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-dashed border-fmz-border-light pt-4 text-[12.5px] text-fmz-text-muted">
                <span>Não recebeu o e-mail?</span>
                <FmzButton
                  type="button"
                  variant="link"
                  onClick={handleResend}
                  disabled={isResendCoolingDown || isSubmitting}
                  className="font-sans font-semibold text-fmz-navy no-underline hover:underline"
                >
                  {isSubmitting
                    ? 'Reenviando…'
                    : isResendCoolingDown
                      ? `Reenviar em ${resendCooldown}s`
                      : 'Reenviar link'}
                </FmzButton>
              </div>
            </div>
          ) : (
            <>
              <Link
                href={fmzPublicLayoutConfig.homePath}
                className="mb-6 inline-flex items-center gap-1.5 self-start rounded-[9px] border-[1.5px] border-fmz-border-light bg-white py-1.5 pl-2.5 pr-3 text-[12.5px] font-semibold text-fmz-text-muted no-underline transition hover:-translate-x-px hover:border-fmz-navy hover:text-fmz-navy"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Voltar para o login
              </Link>

              <div className="mb-7">
                <span className="mb-3 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-fmz-gold-dark">
                  <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-[#FBF3DA] text-fmz-gold-dark">
                    <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                  Esqueci minha senha
                </span>
                <h1
                  id="fmz-request-password-reset-title"
                  className="mb-2 font-sans text-[clamp(26px,3vw,32px)] font-bold tracking-[-0.035em] text-fmz-navy"
                >
                  Recuperar senha
                </h1>
                <p className="max-w-[380px] text-[13.5px] leading-relaxed text-fmz-text-muted">
                  Digite o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um{' '}
                  <b className="font-semibold text-fmz-navy">link seguro</b> para você redefinir a senha.
                </p>
              </div>

              <FmzFormAlert error={apiError} />

              <form onSubmit={handleSubmit} noValidate>
                <FmzEmailInput
                  label="E-mail cadastrado"
                  name="email"
                  placeholder="seu@email.com.br"
                  ariaLabel="Digite seu e-mail"
                  autocompleteDomains={authAccessConfig.emailAutocompleteDomains}
                  errorMessage={fieldErrors.email}
                />
                <FmzButton type="submit" variant="primary" className="mt-6 gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      Enviar link de recuperação
                      <Send className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </FmzButton>
              </form>

              <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-fmz-border-light bg-[#FBF7EE] px-4 py-3.5">
                <p className="text-[12.5px] leading-snug text-fmz-text-muted">
                  <strong className="block text-[13px] font-semibold text-fmz-navy">Ainda não tem conta?</strong>
                  Crie a sua em menos de 1 minuto e comece a investir em imóveis tokenizados.
                </p>
                <Link
                  href="/register"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border-[1.5px] border-fmz-navy bg-white px-3 py-2 text-[12.5px] font-semibold text-fmz-navy no-underline transition hover:bg-fmz-navy hover:text-white"
                >
                  Criar conta
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-6 border-t border-dashed border-fmz-border-light pt-4 text-center text-[12.5px] text-fmz-text-muted">
                Problemas para acessar?{' '}
                <a
                  href={fmzPublicLayoutConfig.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-fmz-navy underline decoration-fmz-border-mid underline-offset-2 hover:decoration-fmz-gold"
                >
                  Fale com a gente
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
