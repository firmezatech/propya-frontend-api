// ─── Registration intent ─────────────────────────────────────────────────────

export type RegistrationIntent = 'tenant' | 'coOwner';
export type LegacyAccountType = 'tenant' | 'investor';

// ─── Form data (accumulated across steps) ─────────────────────────────────────

export type RegisterFormData = {
  email: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  phoneCountry?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  fullName: string;
  registrationIntent?: RegistrationIntent;
  /** D-14 / AE-13: read from the `?invite=` query param on the register page, if present. */
  inviteId?: string;
  /** Legacy field kept for backward-compatible tests and older callers. */
  accountType?: LegacyAccountType;
};

// ─── API payload ──────────────────────────────────────────────────────────────

export type RegisterApiPayload = {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry?: string;
  password: string;
  passwordConfirmation: string;
  registrationIntent?: RegistrationIntent;
  acceptedTerms: true;
  acceptedPrivacyPolicy: true;
  /** D-14 / AE-13: optional, read from the `?invite=` query param. Best-effort on the backend. */
  inviteId?: string;
};

// ─── API response ─────────────────────────────────────────────────────────────

export type RegisterApiUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneCountry?: string;
  registrationIntent?: RegistrationIntent;
  role: string;
};

export type RegisterApiAccess = {
  defaultRoute: string;
  canAccessDashboard: boolean;
  onboardingStatus: string;
  accessToken?: string;
};

export type RegisterApiSuccess = {
  success: true;
  message: string;
  user?: RegisterApiUser;
  access?: RegisterApiAccess;
};

export type RegisterApiFailure = {
  success: false;
  error: import('../../api-errors/domain').FmzNormalizedApiError;
};

export type RegisterApiResult = RegisterApiSuccess | RegisterApiFailure;

// ─── Validation error maps ────────────────────────────────────────────────────

export type RegisterStep1Errors = {
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  terms?: string;
  accountType?: string;
};

export type RegisterStep2Errors = {
  fullName?: string;
  phone?: string;
};

export type RegisterAllErrors = RegisterStep1Errors &
  RegisterStep2Errors & {
    general?: string;
  };
