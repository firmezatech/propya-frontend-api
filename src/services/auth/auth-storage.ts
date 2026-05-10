const readPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const FMZ_AUTH_SESSION_CHANGED_EVENT = 'fmzAuthSessionChanged';

const FMZ_AUTH_TOKEN_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY', 'fmz_access_token');
const LEGACY_AUTH_TOKEN_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_LEGACY_AUTH_TOKEN_STORAGE_KEY', 'accessToken');
const FMZ_CURRENT_ACCESS_STORAGE_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_CURRENT_ACCESS_STORAGE_KEY', 'fmz_current_access');
const FMZ_USER_STORAGE_KEYS = [
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_NAME_STORAGE_KEY', 'name'),
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_EMAIL_STORAGE_KEY', 'email'),
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_WALLET_STORAGE_KEY', 'wallet'),
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_PROFILE_STORAGE_KEY', 'profile'),
  FMZ_CURRENT_ACCESS_STORAGE_KEY,
  'token',
  'authToken',
  'user',
  'userId',
  'role',
  'roles',
  'permissions',
] as const;

export type FmzAuthenticatedUserSession = {
  accessToken?: string;
  name?: string;
  email?: string;
  wallet?: string;
  profile?: string | number | null;
  roleKeys?: readonly string[];
  permissionKeys?: readonly string[];
  accessiblePages?: readonly unknown[];
  isAdmin?: boolean;
};

const isBrowser = () => typeof window !== 'undefined';

const notifyFirmezaSessionChanged = (): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(FMZ_AUTH_SESSION_CHANGED_EVENT));
  window.dispatchEvent(new Event('walletChanged'));
};

export function getFirmezaAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(FMZ_AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
}

export function setFirmezaAccessToken(accessToken: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(FMZ_AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, accessToken);
  notifyFirmezaSessionChanged();
}

export function setFirmezaAuthenticatedUserSession(session: FmzAuthenticatedUserSession): void {
  if (!isBrowser()) return;

  if (session.accessToken) {
    localStorage.setItem(FMZ_AUTH_TOKEN_KEY, session.accessToken);
    localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, session.accessToken);
  }

  const nameKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_NAME_STORAGE_KEY', 'name');
  const emailKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_EMAIL_STORAGE_KEY', 'email');
  const walletKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_WALLET_STORAGE_KEY', 'wallet');
  const profileKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_PROFILE_STORAGE_KEY', 'profile');

  if (typeof session.name === 'string') localStorage.setItem(nameKey, session.name);
  if (typeof session.email === 'string') localStorage.setItem(emailKey, session.email);
  if (typeof session.wallet === 'string') localStorage.setItem(walletKey, session.wallet);
  if (session.profile !== undefined && session.profile !== null) localStorage.setItem(profileKey, String(session.profile));

  localStorage.setItem(FMZ_CURRENT_ACCESS_STORAGE_KEY, JSON.stringify({
    roleKeys: session.roleKeys ?? [],
    permissionKeys: session.permissionKeys ?? [],
    accessiblePages: session.accessiblePages ?? [],
    isAdmin: Boolean(session.isAdmin),
  }));

  notifyFirmezaSessionChanged();
}

export function getFirmezaCurrentAccessSnapshot(): Record<string, unknown> | null {
  if (!isBrowser()) return null;

  try {
    const rawSnapshot = localStorage.getItem(FMZ_CURRENT_ACCESS_STORAGE_KEY);
    return rawSnapshot ? JSON.parse(rawSnapshot) as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function clearFirmezaSession(): void {
  if (!isBrowser()) return;

  const keysToClear = [FMZ_AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY, ...FMZ_USER_STORAGE_KEYS];
  const hadStoredSessionData = keysToClear.some((key) => localStorage.getItem(key) !== null);

  if (!hadStoredSessionData) return;

  keysToClear.forEach((key) => localStorage.removeItem(key));
  notifyFirmezaSessionChanged();
}

export function hasFirmezaSession(): boolean {
  return Boolean(getFirmezaAccessToken());
}
