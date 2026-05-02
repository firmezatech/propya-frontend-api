'use client';

import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { login, createUser, type LoginType, type UserType } from '../../../services/login-fmz-api';
import { setFirmezaAccessToken } from '../../../services/auth/auth-storage';
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

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{t('login')}</h2>
      <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
        {isRegistering ? (
          <>
            <FmzEmailInput
              label={t('email')}
              name="email"
              placeholder={t('enterEmail')}
              ariaLabel="Digite seu e-mail"
              autocompleteDomains={authAccessConfig.emailAutocompleteDomains}
            />
            <div>
              <label className="block text-left text-gray-700 font-medium">{t('name')}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              {t('register')}
            </button>
            <p className="text-gray-600 text-sm text-center mt-4">
              {t('alreadyHaveAccount')}{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="font-medium text-blue-600 underline-offset-4 transition hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('linkLogin')}
              </button>
            </p>
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
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              {t('login')}
            </button>
            <p className="text-gray-600 text-sm text-center mt-4">
              {t('notAccountYet')}{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="font-medium text-blue-600 underline-offset-4 transition hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('register')}
              </button>
            </p>
          </>
        )}
      </form>
      {message && <p className="text-green-500 text-center mt-4">{message}</p>}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
    </div>
  );
}
