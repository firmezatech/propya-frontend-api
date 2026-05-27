// ─── Account type ─────────────────────────────────────────────────────────────

/** The only two user-selectable account types. Admin is never exposed here. */
export type AccountType = 'tenant' | 'investor';

// ─── Form data (accumulated across steps) ─────────────────────────────────────

export type RegisterFormData = {
  // Pre-step / Step 1
  accountType: AccountType;
  email: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;

  // Step 2
  fullName: string;
  birthdate: string; // display format: DD/MM/AAAA
  cpf: string;       // display format: 000.000.000-00
};

// ─── API payload ──────────────────────────────────────────────────────────────

export type RegisterApiPayload = {
  email: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  fullName: string;
  birthdate: string;        // ISO: YYYY-MM-DD
  cpf: string;              // with mask: 000.000.000-00
  acceptedTerms: true;
  acceptedPrivacyPolicy: true;
  accountType: AccountType;
};

// ─── API response ─────────────────────────────────────────────────────────────

export type RegisterApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  phoneE164?: string;
  birthdate: string;
  accountType: AccountType;
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
  accountType?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  phone?: string;
  terms?: string;
};

export type RegisterStep2Errors = {
  fullName?: string;
  birthdate?: string;
  cpf?: string;
};

export type RegisterAllErrors = RegisterStep1Errors & RegisterStep2Errors & {
  general?: string;
};
