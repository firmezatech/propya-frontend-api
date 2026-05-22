'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { z } from 'zod';
import { FmzBrandMark } from '../../../components/layout';
import { FmzButton } from '../../../components/design-system';
import { FmzEmailInput } from '../../auth-access/components/FmzEmailInput';
import { FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES, type FmzFieldErrorMap, type FmzNormalizedApiError } from '../../api-errors/domain';
import { getFmzAuthAccessConfig } from '../../auth-access/config/fmz-auth-access-config';
import { requestPasswordReset } from '../../../services/login-fmz-api';
import { buildFmzRequestPasswordResetSchema } from '../domain/fmz-password-reset-validation';

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
  const router = useRouter();
  const authAccessConfig = useMemo(() => getFmzAuthAccessConfig(), []);
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FmzFieldErrorMap>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setFieldErrors({});
    setMessage('');

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const payload = buildFmzRequestPasswordResetSchema().parse(formData);
      setIsSubmitting(true);
      const response = await requestPasswordReset(payload);

      if (!response.success) {
        setApiError(response.error);
        setFieldErrors(response.error.fieldErrors);
        return;
      }

      setMessage('Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição de senha.');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = buildValidationError(error);
        setApiError(validationError.alertError);
        setFieldErrors(validationError.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-[440px]" aria-labelledby="fmz-request-password-reset-title">
      <div className="mb-10 text-center">
        <FmzBrandMark size="form" className="mb-7" />
        <h1 id="fmz-request-password-reset-title" className="mb-2 font-sans text-[26px] font-extrabold tracking-[-0.025em] text-fmz-navy">
          Redefinir senha
        </h1>
        <p className="text-sm text-fmz-text-muted">
          Informe seu e-mail para receber as instruções de redefinição.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border-[1.5px] border-fmz-border-light bg-white px-6 py-8 sm:px-10 sm:py-9">
        <FmzFormAlert error={apiError} />
        <FmzEmailInput
          label="E-mail"
          name="email"
          placeholder="seu@email.com.br"
          ariaLabel="Digite seu e-mail"
          autocompleteDomains={authAccessConfig.emailAutocompleteDomains}
          errorMessage={fieldErrors.email}
        />
        <FmzButton type="submit" variant="primary" className="mt-6" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
        </FmzButton>
      </form>

      <div className="mt-7 text-center text-sm text-fmz-text-muted">
        Lembrou sua senha?{' '}
        <FmzButton type="button" variant="link" className="font-sans font-bold text-fmz-navy" onClick={() => router.push('/')}>
          Faça login
        </FmzButton>
      </div>

      {message && <p className="mt-4 text-center text-sm text-green-700">{message}</p>}
    </section>
  );
}
