'use client';

import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { login, createUser, type LoginType, type UserType } from '../../../services/login-fmz-api';
import { setFirmezaAccessToken } from '../../../services/auth/auth-storage';
import { FmzBrandMark } from '../../../components/layout';
import { FmzButton, FmzTextInput } from '../../../components/design-system';
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

export function FmzAuthAccessCard({ className = '' }: FmzAuthAccessCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const t = useTranslations('HomePage');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const authAccessConfig = useMemo(() => getFmzAuthAccessConfig(), []);

  useEffect(() => {
    setMessage('');
    setError('');
  }, [isRegistering]);

  const handleLogin = async (formData: Record<string, FormDataEntryValue>) => {
    buildFmzLoginSchema().parse(formData);

    const loginData: LoginType = {
      email: getFormStringValue(formData, 'email'),
      password: getFormStringValue(formData, 'password'),
    };

    const response = await login(loginData);

    if (!response.success) {
      setError(response.message);
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
      setError(response.message);
      return;
    }

    formRef.current?.reset();
    setIsRegistering(false);
    setMessage('Usuário criado com sucesso. Faça o login.');
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      if (isRegistering) {
        await handleRegistration(formData);
        return;
      }

      await handleLogin(formData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors.map((issue) => issue.message).join(' '));
        return;
      }

      setError('Não foi possível processar sua solicitação. Tente novamente.');
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
        <div className="space-y-5">
          {isRegistering ? (
            <>
              <FmzEmailInput
                label={t('email')}
                name="email"
                placeholder={t('enterEmail')}
                ariaLabel="Digite seu e-mail"
                autocompleteDomains={authAccessConfig.emailAutocompleteDomains}
              />
              <div className="space-y-2">
                <label className="block text-left text-xs font-medium uppercase tracking-[0.06em] text-fmz-text-muted">{t('name')}</label>
                <FmzTextInput
                  type="text"
                  placeholder={t('enterName')}
                  name="name"
                  required
                  aria-label="Digite seu nome"
                />
              </div>
              <FmzPhoneInput
                label={t('phone')}
                countryLabel={t('phoneCountry')}
                phoneAriaLabel="Digite seu telefone(WhatsApp)"
              />
              <FmzBirthdateInput
                label={t('birthdate')}
                placeholder={t('enterBirthdate')}
                ariaLabel="Digite sua data de nascimento"
              />
              <FmzPasswordInput
                label={t('password')}
                name="password"
                placeholder={t('enterPassword')}
                autoComplete="new-password"
                showLabel={t('showPassword')}
                hideLabel={t('hidePassword')}
                ariaLabel="Digite sua senha"
              />
              <FmzPasswordInput
                label={t('confirmPassword')}
                name="confirmPassword"
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
                showLabel={t('showPassword')}
                hideLabel={t('hidePassword')}
                ariaLabel="Confirme a senha"
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
              />
              <FmzPasswordInput
                label={t('password')}
                name="password"
                placeholder={t('enterPassword')}
                autoComplete="current-password"
                showLabel={t('showPassword')}
                hideLabel={t('hidePassword')}
                ariaLabel="Digite sua senha"
              />
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

      {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </section>
  );
}
