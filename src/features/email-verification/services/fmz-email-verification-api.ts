import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { normalizeFmzApiError } from '../../api-errors/domain';
import type { FmzApiResult } from '../../api-errors/domain';

export type VerifyEmailResponse = FmzApiResult<{ defaultRoute?: string }>;

export type ResendVerificationEmailResponse = FmzApiResult<object>;

export async function resendVerificationEmail(email: string): Promise<ResendVerificationEmailResponse> {
  try {
    const response = await firmezaApiClient.post('/resendVerificationEmail', { email });
    return {
      success: true,
      message: typeof response.data?.message === 'string' ? response.data.message : 'Link enviado.',
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResponse> {
  try {
    const response = await firmezaApiClient.get('/verifyEmail', { params: { token } });
    return {
      success: true,
      message: typeof response.data?.message === 'string' ? response.data.message : 'E-mail verificado com sucesso.',
      defaultRoute: response.data?.defaultRoute,
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}
