import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { normalizeFmzApiError } from '../../api-errors/domain';
import type { FmzApiResult } from '../../api-errors/domain';

export type FmzPasswordResetConfig = {
  emailAutocompleteDomains: string[];
};

export const getFmzPasswordResetConfig = (): FmzPasswordResetConfig => ({
  emailAutocompleteDomains: (process.env.NEXT_PUBLIC_FMZ_EMAIL_AUTOCOMPLETE_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
});

export type RequestPasswordResetType = {
  email: string;
};

export type ResetPasswordType = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type PasswordResetResponse = FmzApiResult<{}>;

const getSuccessMessage = (data: Record<string, unknown>, fallback: string): string =>
  typeof data?.message === 'string' && data.message.trim().length > 0 ? data.message.trim() : fallback;

export async function requestPasswordReset(payload: RequestPasswordResetType): Promise<PasswordResetResponse> {
  try {
    const response = await firmezaApiClient.post('/requestPasswordReset', {
      email: payload.email,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Enviamos as instruções para redefinir sua senha.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function resetPassword(payload: ResetPasswordType): Promise<PasswordResetResponse> {
  try {
    const response = await firmezaApiClient.post('/resetPassword', {
      token: payload.token,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Senha redefinida com sucesso.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}
