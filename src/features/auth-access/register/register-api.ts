/**
 * Registration API — owns only payload assembly, HTTP call and response
 * normalization for the public registration page.
 */

import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { setFirmezaAuthenticatedUserSession } from '../../../services/auth/auth-storage';
import { normalizeFmzApiError } from '../../api-errors/domain';
import type { RegisterApiPayload, RegisterApiResult, RegisterFormData, RegistrationIntent } from './register.types';

const buildRegisterPayload = (data: RegisterFormData): RegisterApiPayload => ({
  fullName: data.fullName.trim(),
  email: data.email.trim(),
  phone: data.phone.trim(),
  phoneCountry: data.phoneCountry || 'BR',
  birthdate: data.birthdate,
  password: data.password,
  passwordConfirmation: data.passwordConfirmation,
  cpf: data.cpf,
  registrationIntent: data.registrationIntent || 'coOwner',
  acceptedTerms: true,
  acceptedPrivacyPolicy: true,
});

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const getBoolean = (value: unknown): boolean => Boolean(value);

export async function registerUser(data: RegisterFormData): Promise<RegisterApiResult> {
  try {
    const payload = buildRegisterPayload(data);
    const response = await firmezaApiClient.post('/register', payload);

    const body = recordOf(response.data);
    const user = recordOf(body.user ?? body.data ?? body);
    const access = recordOf(body.access ?? body);

    const accessToken = getString(access.accessToken ?? access.token ?? user.accessToken ?? user.token);
    const defaultRoute = getString(access.defaultRoute ?? access.default_route, '/connected/dashboard');
    const onboardingStatus = getString(access.onboardingStatus ?? access.onboarding_status, 'incomplete');

    if (accessToken) {
      setFirmezaAuthenticatedUserSession({
        accessToken,
        name: getString(user.fullName ?? user.full_name ?? user.name),
        email: getString(user.email),
      });
    }

    return {
      success: true,
      message: getString(body.message ?? body.msg, 'Cadastro realizado com sucesso.'),
      user: {
        id: getString(user.id ?? user._id),
        fullName: getString(user.fullName ?? user.full_name ?? user.name),
        email: getString(user.email),
        phone: getString(user.phone),
        phoneCountry: getString(user.phoneCountry ?? user.phone_country) || undefined,
        birthdate: getString(user.birthdate),
        registrationIntent:
          (getString(user.registrationIntent ?? user.registration_intent) as RegistrationIntent) || data.registrationIntent || 'coOwner',
        role: getString(user.role),
      },
      access: {
        defaultRoute,
        canAccessDashboard: getBoolean(access.canAccessDashboard ?? access.can_access_dashboard),
        onboardingStatus,
        accessToken: accessToken || undefined,
      },
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}
