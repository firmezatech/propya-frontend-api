/**
 * Registration API — single-responsibility module for the POST /auth/register call.
 *
 * What this module owns:
 *   - Payload assembly from validated form data
 *   - HTTP request + response normalization
 *   - Optional auto-login: stores the auth session when the backend returns an
 *     access token (mirrors login.ts behaviour for a seamless post-registration UX)
 *
 * What this module must NOT own:
 *   - Input validation (register.validation.ts)
 *   - UI state (RegisterPage.tsx)
 *   - Routing decisions (RegisterPage.tsx)
 */

import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { setFirmezaAuthenticatedUserSession } from '../../../services/auth/auth-storage';
import { normalizeFmzApiError } from '../../api-errors/domain';
import { birthdateBRToISO } from './register.validation';
import type { RegisterApiResult, RegisterFormData } from './register.types';

// ─── Payload assembly ─────────────────────────────────────────────────────────

/**
 * Assembles the backend-ready payload from validated form data.
 * Converts birthdate from display format (DD/MM/AAAA) to ISO (YYYY-MM-DD).
 * CPF is sent with mask as the backend expects it (000.000.000-00).
 */
const buildRegisterPayload = (data: RegisterFormData) => ({
  email: data.email.trim(),
  password: data.password,
  passwordConfirmation: data.passwordConfirmation,
  phone: data.phone.trim(),
  fullName: data.fullName.trim(),
  birthdate: birthdateBRToISO(data.birthdate),
  cpf: data.cpf,
  acceptedTerms: true as const,
  acceptedPrivacyPolicy: true as const,
  accountType: data.accountType,
});

// ─── Response normalization ───────────────────────────────────────────────────

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const getBoolean = (value: unknown): boolean => Boolean(value);

// ─── API call ─────────────────────────────────────────────────────────────────

/**
 * Calls POST /auth/register with the assembled payload.
 *
 * On success:
 *   - If the backend returns an accessToken, stores the auth session so the
 *     user is immediately logged in without a separate login step.
 *
 * On failure:
 *   - Returns a normalized error discriminant compatible with the rest of the
 *     FMZ error handling infrastructure.
 */
export async function registerUser(data: RegisterFormData): Promise<RegisterApiResult> {
  try {
    const payload = buildRegisterPayload(data);
    const response = await firmezaApiClient.post('/auth/register', payload);

    const body = recordOf(response.data);
    const user = recordOf(body.user ?? body.data ?? body);
    const access = recordOf(body.access ?? body);

    const accessToken = getString(access.accessToken ?? access.token ?? user.accessToken ?? user.token);
    const defaultRoute = getString(access.defaultRoute ?? access.default_route, '/connected/dashboard');
    const onboardingStatus = getString(access.onboardingStatus ?? access.onboarding_status, 'incomplete');

    // Auto-login: store session when backend provides a token.
    if (accessToken) {
      setFirmezaAuthenticatedUserSession({
        accessToken,
        name: getString(user.fullName ?? user.name),
        email: getString(user.email),
      });
    }

    return {
      success: true,
      message: getString(body.message ?? body.msg, 'Cadastro realizado com sucesso.'),
      user: {
        id: getString(user.id ?? user._id),
        firstName: getString(user.firstName ?? user.first_name),
        lastName: getString(user.lastName ?? user.last_name),
        fullName: getString(user.fullName ?? user.full_name ?? user.name),
        email: getString(user.email),
        phone: getString(user.phone),
        phoneE164: getString(user.phoneE164 ?? user.phone_e164) || undefined,
        birthdate: getString(user.birthdate),
        accountType: (getString(user.accountType ?? user.account_type) as 'tenant' | 'investor') || data.accountType,
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
