'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { login, type LoginType } from '../../../services/login-fmz-api';
import { FmzBrandMark, FmzFullPageLoading } from '../../../components/layout';
import { FmzButton } from '../../../components/design-system';
import { FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES, type FmzFieldErrorMap, type FmzNormalizedApiError } from '../../api-errors/domain';
import { getFmzAuthAccessConfig } from '../config/fmz-auth-access-config';
import { buildFmzLoginSchema } from '../domain/fmz-auth-access-validation';
import { useLoginWelcomeMessage } from '../domain/fmz-login-welcome';
import { FmzEmailInput } from './FmzEmailInput';
import { FmzPasswordInput } from './FmzPasswordInput';

type FmzAuthAccessCardProps = {
  className?: string;
};

const getFormStringValue = (formData: Record<string, FormDataEntryValue>, fieldName: string): string => (
  String(formData[fieldName] ?? '')
);

const zodPathToField: Record<string, keyof FmzFieldErrorMap> = Object.freeze({
  email: 'email',
  password: 'password',
  confirmPassword: 'confirmPassword',
  phone: 'phone',
  phoneCountry: 'phone',
  birthdate: 'birthdate',
  name: 'name',
});

const buildValidationErrorState = (validationError: z.ZodError): {
  alertError: FmzNormalizedApiError;
  fieldErrors: FmzFieldErrorMap;
} => {
  const fieldErrors: FmzFieldErrorMap = {};

  validationError.errors.forEach((issue) => {
    const fieldName = zodPathToField[String(issue.path[0] ?? '')];
    if (!fieldName || fieldErrors[fieldName]) return;
    fieldErrors[fieldName] = issue.message;
  });

  return {
    fieldErrors,
    alertError: {
      code: FMZ_API_ERROR_CODES.VALIDATION_ERROR,
      title: 'Revise os dados informados',
      description: 'Alguns dados parecem incorretos. Corrija os campos destacados e tente novamente.',
      severity: 'error',
      fieldErrors,
    },
  };
};

export function FmzAuthAccessCard({ className = '' }: FmzAuthAccessCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const t = useTranslations('HomePage');
  // Resolved after hydration via useEffect — reads propya_has_visited from localStorage.
  // Initial render is "Bem vindo" (SSR-safe); effect corrects for returning visitors.
  const loginWelcomeMessage = useLoginWelcomeMessage();
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FmzFieldErrorMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingAfterLogin, setIsRedirectingAfterLogin] = useState(false);
  const authAccessConfig = useMemo(() => getFmzAuthAccessConfig(), []);

  const applyApiError = (error: FmzNormalizedApiError) => {
    setApiError(error);
    setFieldErrors(error.fieldErrors);
  };

  const handleLogin = async (formData: Record<string, FormDataEntryValue>) => {
    buildFmzLoginSchema().parse(formData);

    const loginData: LoginType = {
      email: getFormStringValue(formData, 'email'),
      password: getFormStringValue(formData, 'password'),
    };

    const response = await login(loginData);

    if (!response.success) {
      applyApiError(response.error);
      return;
    }

    formRef.current?.reset();
    setIsRedirectingAfterLogin(true);
    router.replace('/connected/dashboard');
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isRedirectingAfterLogin) return;

    setApiError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await handleLogin(formData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const validationState = buildValidationErrorState(validationError);
        setFieldErrors(validationState.fieldErrors);
        setApiError(validationState.alertError);
        return;
      }

      setApiError({
        code: FMZ_API_ERROR_CODES.UNKNOWN_ERROR,
        title: 'Não foi possível concluir a solicitação',
        description: 'Tente novamente em instantes. Se o problema continuar, entre em contato com o suporte.',
        severity: 'error',
        fieldErrors: {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRedirectingAfterLogin) {
    return (
      <FmzFullPageLoading
        label="Entrando na plataforma..."
        description="Estamos carregando sua sessão, permissões e menu lateral."
        className="min-h-[520px] bg-transparent px-0"
      />
    );
  }

  return (
    <section className={className} aria-labelledby="fmz-auth-access-title">
      <div className="mb-10 text-center">
        <FmzBrandMark size="form" className="mb-7" />
        <h1 id="fmz-auth-access-title" className="mb-2 font-sans text-[26px] font-extrabold tracking-[-0.025em] text-fmz-navy">
          {loginWelcomeMessage}
        </h1>
        <p className="text-sm text-fmz-text-muted">
          {t('notAccountYet')}{' '}
          <FmzButton
            type="button"
            variant="link"
            disabled={isSubmitting}
            onClick={() => router.push('/register')}
          >
            {t('registerFree')}
          </FmzButton>
        </p>
      </div>

      <form ref={formRef} onSubmit={handleFormSubmit} aria-busy={isSubmitting} className="rounded-2xl border-[1.5px] border-fmz-border-light bg-white px-6 py-8 sm:px-10 sm:py-9">
        <FmzFormAlert error={apiError} />

        <div className="space-y-5">
          <FmzEmailInput
            label={t('email')}
            name="email"
            placeholder={t('enterEmail')}
            ariaLabel="Digite seu e-mail"
            autocompleteDomains={authAccessConfig.emailAutocompleteDomains}
            errorMessage={fieldErrors.email}
          />
          <FmzPasswordInput
            label={t('password')}
            name="password"
            placeholder={t('enterPassword')}
            autoComplete="current-password"
            showLabel={t('showPassword')}
            hideLabel={t('hidePassword')}
            ariaLabel="Digite sua senha"
            errorMessage={fieldErrors.password}
          />
          <div className="-mt-2 text-right">
            <FmzButton variant="link" type="button" onClick={() => router.push('/request-password-reset')} className="text-[13px] text-fmz-text-hint hover:text-fmz-blue">
              Esqueci minha senha
            </FmzButton>
          </div>
        </div>

        <FmzButton type="submit" variant="primary" className="mt-6 gap-2" disabled={isSubmitting}>
          {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" /> : null}
          {isSubmitting ? 'Validando acesso...' : t('loginPlatform')}
        </FmzButton>
      </form>

      <div className="mt-7 text-center text-sm text-fmz-text-muted">
        {t('notAccountYet')}{' '}
        <FmzButton type="button" variant="link" className="font-sans font-bold text-fmz-navy" disabled={isSubmitting} onClick={() => router.push('/register')}>
          {t('goToRegister')}
        </FmzButton>
      </div>
    </section>
  );
}
