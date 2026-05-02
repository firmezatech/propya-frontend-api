'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { FmzBrandMark } from '../../../components/layout';
import { FmzButton } from '../../../components/design-system';
import { FmzPasswordInput } from '../../auth-access/components/FmzPasswordInput';
import { FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES, type FmzFieldErrorMap, type FmzNormalizedApiError } from '../../api-errors/domain';
import { resetPassword } from '../../../services/login-fmz-api';
import { buildFmzResetPasswordSchema } from '../domain/fmz-password-reset-validation';

const zodPathToField: Record<string, keyof FmzFieldErrorMap> = Object.freeze({
  password: 'password',
  confirmPassword: 'confirmPassword',
  token: 'password',
});

const buildValidationError = (error: z.ZodError): { fieldErrors: FmzFieldErrorMap; alertError: FmzNormalizedApiError } => {
  const fieldErrors: FmzFieldErrorMap = {};

  error.errors.forEach((issue) => {
    const fieldName = zodPathToField[String(issue.path[0] ?? '')];
    if (!fieldName || fieldErrors[fieldName]) return;
    fieldErrors[fieldName] = issue.message;
  });

  return {
    fieldErrors,
    alertError: {
      code: FMZ_API_ERROR_CODES.VALIDATION_ERROR,
      title: 'Revise a nova senha',
      description: 'Corrija os campos destacados para redefinir sua senha.',
      severity: 'error',
      fieldErrors,
    },
  };
};

export function FmzResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FmzFieldErrorMap>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetToken = searchParams.get('token') || '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setFieldErrors({});
    setMessage('');

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const payload = buildFmzResetPasswordSchema().parse({
        ...formData,
        token: resetToken,
      });

      setIsSubmitting(true);
      const response = await resetPassword(payload);

      if (!response.success) {
        setApiError(response.error);
        setFieldErrors(response.error.fieldErrors);
        return;
      }

      setMessage('Senha redefinida com sucesso. Você já pode fazer login.');
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
    <section className="w-full max-w-[440px]" aria-labelledby="fmz-reset-password-title">
      <div className="mb-10 text-center">
        <FmzBrandMark size="form" className="mb-7" />
        <h1 id="fmz-reset-password-title" className="mb-2 font-syne text-[26px] font-extrabold tracking-[-0.025em] text-fmz-navy">
          Criar nova senha
        </h1>
        <p className="text-sm text-fmz-text-muted">
          Escolha uma nova senha para acessar sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border-[1.5px] border-fmz-border-light bg-white px-6 py-8 sm:px-10 sm:py-9">
        <FmzFormAlert error={apiError} />
        <div className="space-y-5">
          <FmzPasswordInput
            label="Nova senha"
            name="password"
            placeholder="Digite sua nova senha"
            autoComplete="new-password"
            showLabel="Ver senha"
            hideLabel="Ocultar senha"
            ariaLabel="Digite sua nova senha"
            errorMessage={fieldErrors.password}
          />
          <FmzPasswordInput
            label="Confirmar nova senha"
            name="confirmPassword"
            placeholder="Confirme sua nova senha"
            autoComplete="new-password"
            showLabel="Ver senha"
            hideLabel="Ocultar senha"
            ariaLabel="Confirme sua nova senha"
            errorMessage={fieldErrors.confirmPassword}
          />
        </div>
        <FmzButton type="submit" variant="primary" className="mt-6" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
        </FmzButton>
      </form>

      <div className="mt-7 text-center text-sm text-fmz-text-muted">
        Voltar para{' '}
        <FmzButton type="button" variant="link" className="font-syne font-bold text-fmz-navy" onClick={() => router.push('/')}>
          login
        </FmzButton>
      </div>

      {message && <p className="mt-4 text-center text-sm text-green-700">{message}</p>}
    </section>
  );
}
