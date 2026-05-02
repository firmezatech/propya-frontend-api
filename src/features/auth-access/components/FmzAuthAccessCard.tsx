'use client';

import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { login, createUser, type LoginType, type UserType } from '../../../services/login-fmz-api';
import { setFirmezaAccessToken } from '../../../services/auth/auth-storage';
import { FmzBrandMark } from '../../../components/layout';
import { FmzButton, FmzTextInput } from '../../../components/design-system';
import { FmzFieldErrorMessage, FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES, type FmzFieldErrorMap, type FmzNormalizedApiError } from '../../api-errors/domain';
import { getFmzAuthAccessConfig } from '../config/fmz-auth-access-config';
import { buildFmzLoginSchema, buildFmzRegistrationSchema } from '../domain/fmz-auth-access-validation';
import { FmzBirthdateInput } from './FmzBirthdateInput';
import { FmzEmailInput } from './FmzEmailInput';
import { FmzPasswordInput } from './FmzPasswordInput';
import { FmzPhoneInput } from './FmzPhoneInput';

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
  const [message, setMessage] = useState('');
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FmzFieldErrorMap>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const authAccessConfig = useMemo(() => getFmzAuthAccessConfig(), []);

  useEffect(() => {
    setMessage('');
    setApiError(null);
    setFieldErrors({});
  }, [isRegistering]);

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

    if (response.accessToken) {
      setFirmezaAccessToken(response.accessToken);
    }

    localStorage.setItem('name', response.name || '');
    localStorage.setItem('wallet', response.wallet || '');
    localStorage.setItem('profile', String(response.profile || ''));
    formRef.current?.reset();
    router.replace('/connected/dashboard');
  };

  const handleRegistration = async (formData: Record<string, FormDataEntryValue>) => {
    buildFmzRegistrationSchema(authAccessConfig.minimumRegistrationAge).parse(formData);

    const registerData: UserType = {
      name: getFormStringValue(formData, 'name'),
      email: getFormStringValue(formData, 'email'),
      phone: getFormStringValue(formData, 'phone'),
      birthdate: getFormStringValue(formData, 'birthdate'),
      password: getFormStringValue(formData, 'password'),
      confirmPassword: getFormStringValue(formData, 'confirmPassword'),
    };

    const response = await createUser(registerData);

    if (!response.success) {
      applyApiError(response.error);
      return;
    }

    formRef.current?.reset();
    setIsRegistering(false);
    setMessage('Usuário criado com sucesso. Faça o login.');
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setApiError(null);
    setFieldErrors({});

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      if (isRegistering) {
        await handleRegistration(formData);
        return;
      }

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
    }
  };

  const formTitle = isRegistering ? t('registerWelcome') : t('loginWelcome');
  const formSubtitle = isRegistering ? t('alreadyHaveAccount') : t('notAccountYet');
  const formToggleLabel = isRegistering ? t('goToLogin') : t('registerFree');
  const submitLabel = isRegistering ? t('register') : t('loginPlatform');

  return (
    <section className={className} aria-labelledby="fmz-auth-access-title">
      <div className="mb-10 text-center">
        <FmzBrandMark size="form" className="mb-7" />
        <h1 id="fmz-auth-access-title" className="mb-2 font-syne text-[26px] font-extrabold tracking-[-0.025em] text-fmz-navy">
          {formTitle}
        </h1>
        <p className="text-sm text-fmz-text-muted">
          {formSubtitle}{' '}
          <FmzButton
            type="button"
            variant="link"
            onClick={() => setIsRegistering((currentValue) => !currentValue)}
          >
            {formToggleLabel}
          </FmzButton>
        </p>
      </div>

      <form ref={formRef} onSubmit={handleFormSubmit} className="rounded-2xl border-[1.5px] border-fmz-border-light bg-white px-6 py-8 sm:px-10 sm:py-9">
        <FmzFormAlert error={apiError} />

        <div className="space-y-5">
          {isRegistering ? (
            <>
              <FmzEmailInput
                label={t('email')}
                name="email"
                placeholder={t('enterEmail')}
                ariaLabel="Digite seu e-mail"
                autocompleteDomains={authAccessConfig.emailAutocompleteDomains}
                errorMessage={fieldErrors.email}
              />
              <div className="space-y-2">
                <label className="block text-left text-xs font-medium uppercase tracking-[0.06em] text-fmz-text-muted">{t('name')}</label>
                <FmzTextInput
                  type="text"
                  placeholder={t('enterName')}
                  name="name"
                  required
                  aria-label="Digite seu nome"
                  hasError={Boolean(fieldErrors.name)}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                <FmzFieldErrorMessage message={fieldErrors.name} />
              </div>
              <FmzPhoneInput
                label={t('phone')}
                countryLabel={t('phoneCountry')}
                phoneAriaLabel="Digite seu telefone(WhatsApp)"
                errorMessage={fieldErrors.phone}
              />
              <FmzBirthdateInput
                label={t('birthdate')}
                placeholder={t('enterBirthdate')}
                ariaLabel="Digite sua data de nascimento"
                errorMessage={fieldErrors.birthdate}
              />
              <FmzPasswordInput
                label={t('password')}
                name="password"
                placeholder={t('enterPassword')}
                autoComplete="new-password"
                showLabel={t('showPassword')}
                hideLabel={t('hidePassword')}
                ariaLabel="Digite sua senha"
                errorMessage={fieldErrors.password}
              />
              <FmzPasswordInput
                label={t('confirmPassword')}
                name="confirmPassword"
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
                showLabel={t('showPassword')}
                hideLabel={t('hidePassword')}
                ariaLabel="Confirme a senha"
                errorMessage={fieldErrors.confirmPassword}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <FmzButton type="submit" variant="primary" className="mt-6">
          {submitLabel}
        </FmzButton>
      </form>

      <div className="mt-7 text-center text-sm text-fmz-text-muted">
        {formSubtitle}{' '}
        <FmzButton type="button" variant="link" className="font-syne font-bold text-fmz-navy" onClick={() => setIsRegistering((currentValue) => !currentValue)}>
          {isRegistering ? t('goToLogin') : t('goToRegister')}
        </FmzButton>
      </div>

      {message && <p className="mt-4 text-center text-sm text-green-700">{message}</p>}
    </section>
  );
}
