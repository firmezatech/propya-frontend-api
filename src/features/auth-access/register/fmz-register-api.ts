import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { setFirmezaAuthenticatedUserSession } from '../../../services/auth/auth-storage';
import { normalizeFmzApiError } from '../../api-errors/domain';
import { birthdateBRToISO } from './fmz-register-validation';
import type {
  RegisterApiAccess,
  RegisterApiPayload,
  RegisterApiResult,
  RegisterApiUser,
  RegisterFormData,
  RegistrationIntent,
} from './fmz-register.types';

const buildRegisterPayload = (data: RegisterFormData): RegisterApiPayload => ({
  fullName: data.fullName.trim(),
  email: data.email.trim(),
  phone: data.phone.trim(),
  phoneCountry: data.phoneCountry || 'BR',
  birthdate: birthdateBRToISO(data.birthdate),
  password: data.password,
  passwordConfirmation: data.passwordConfirmation,
  registrationIntent: data.registrationIntent || 'coOwner',
  acceptedTerms: true,
  acceptedPrivacyPolicy: true,
  ...(data.inviteId ? { inviteId: data.inviteId } : {}),
});

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const asBoolean = (value: unknown): boolean => Boolean(value);

const extractAccessToken = (
  access: Record<string, unknown>,
  user: Record<string, unknown>,
): string => asString(access.accessToken ?? access.token ?? user.accessToken ?? user.token);

const normalizeUser = (
  user: Record<string, unknown>,
  requestIntent?: RegistrationIntent,
): RegisterApiUser => ({
  id: asString(user.id ?? user._id),
  fullName: asString(user.fullName ?? user.full_name ?? user.name),
  email: asString(user.email),
  phone: asString(user.phone),
  phoneCountry: asString(user.phoneCountry ?? user.phone_country) || undefined,
  registrationIntent:
    (asString(user.registrationIntent ?? user.registration_intent) as RegistrationIntent) ||
    requestIntent ||
    'coOwner',
  role: asString(user.role),
});

const normalizeAccess = (
  access: Record<string, unknown>,
  accessToken: string,
): RegisterApiAccess => ({
  defaultRoute: asString(access.defaultRoute ?? access.default_route, '/connected/dashboard'),
  canAccessDashboard: asBoolean(access.canAccessDashboard ?? access.can_access_dashboard),
  onboardingStatus: asString(access.onboardingStatus ?? access.onboarding_status, 'incomplete'),
  accessToken: accessToken || undefined,
});

const normalizeRegistrationResponse = (
  responseData: unknown,
  requestIntent?: RegistrationIntent,
): { message: string; user: RegisterApiUser; access: RegisterApiAccess; accessToken: string } => {
  const body = asRecord(responseData);
  const user = asRecord(body.user ?? body.data ?? body);
  const access = asRecord(body.access ?? body);
  const accessToken = extractAccessToken(access, user);

  return {
    message: asString(body.message ?? body.msg, 'Cadastro realizado com sucesso.'),
    user: normalizeUser(user, requestIntent),
    access: normalizeAccess(access, accessToken),
    accessToken,
  };
};

export async function registerUser(data: RegisterFormData): Promise<RegisterApiResult> {
  try {
    const payload = buildRegisterPayload(data);
    const response = await firmezaApiClient.post('/register', payload);
    const { accessToken, ...normalized } = normalizeRegistrationResponse(
      response.data,
      data.registrationIntent,
    );

    if (accessToken) {
      setFirmezaAuthenticatedUserSession({
        accessToken,
        name: normalized.user.fullName,
        email: normalized.user.email,
      });
    }

    return { success: true, ...normalized };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}
