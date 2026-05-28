const readPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const FMZ_AUTH_SESSION_CHANGED_EVENT = 'fmzAuthSessionChanged';

const FMZ_AUTH_TOKEN_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY', 'fmz_access_token');
const LEGACY_AUTH_TOKEN_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_LEGACY_AUTH_TOKEN_STORAGE_KEY', 'accessToken');
const FMZ_CURRENT_ACCESS_STORAGE_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_CURRENT_ACCESS_STORAGE_KEY', 'fmz_current_access');
const FMZ_AUTH_PERSISTENCE_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_AUTH_PERSISTENCE_STORAGE_KEY', 'fmz_auth_persistence');
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

type FmzSessionStorageMode = 'local' | 'session';

type FmzSessionStorageOptions = {
  rememberMe?: boolean;
};

const isBrowser = () => typeof window !== 'undefined';

const notifyFirmezaSessionChanged = (): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(FMZ_AUTH_SESSION_CHANGED_EVENT));
  window.dispatchEvent(new Event('walletChanged'));
};

const getPrimaryStorage = (mode: FmzSessionStorageMode): Storage => (mode === 'local' ? localStorage : sessionStorage);
const getSecondaryStorage = (mode: FmzSessionStorageMode): Storage => (mode === 'local' ? sessionStorage : localStorage);

const getSessionStorageMode = (options?: FmzSessionStorageOptions): FmzSessionStorageMode => (
  options?.rememberMe === false ? 'session' : 'local'
);

const getStoredValue = (key: string): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const removeFromBothStorages = (key: string): void => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export function getFirmezaAccessToken(): string | null {
  if (!isBrowser()) return null;
  return getStoredValue(FMZ_AUTH_TOKEN_KEY) || getStoredValue(LEGACY_AUTH_TOKEN_KEY);
}

export function setFirmezaAccessToken(accessToken: string, options?: FmzSessionStorageOptions): void {
  if (!isBrowser()) return;

  const mode = getSessionStorageMode(options);
  const primaryStorage = getPrimaryStorage(mode);
  const secondaryStorage = getSecondaryStorage(mode);

  primaryStorage.setItem(FMZ_AUTH_TOKEN_KEY, accessToken);
  primaryStorage.setItem(LEGACY_AUTH_TOKEN_KEY, accessToken);
  primaryStorage.setItem(FMZ_AUTH_PERSISTENCE_KEY, mode);

  secondaryStorage.removeItem(FMZ_AUTH_TOKEN_KEY);
  secondaryStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  secondaryStorage.removeItem(FMZ_AUTH_PERSISTENCE_KEY);

  notifyFirmezaSessionChanged();
}

export function setFirmezaAuthenticatedUserSession(session: FmzAuthenticatedUserSession, options?: FmzSessionStorageOptions): void {
  if (!isBrowser()) return;

  const mode = getSessionStorageMode(options);
  const primaryStorage = getPrimaryStorage(mode);
  const secondaryStorage = getSecondaryStorage(mode);

  [FMZ_AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY, ...FMZ_USER_STORAGE_KEYS, FMZ_AUTH_PERSISTENCE_KEY].forEach((key) => {
    secondaryStorage.removeItem(key);
    primaryStorage.removeItem(key);
  });

  if (session.accessToken) {
    primaryStorage.setItem(FMZ_AUTH_TOKEN_KEY, session.accessToken);
    primaryStorage.setItem(LEGACY_AUTH_TOKEN_KEY, session.accessToken);
  }

  const nameKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_NAME_STORAGE_KEY', 'name');
  const emailKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_EMAIL_STORAGE_KEY', 'email');
  const walletKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_WALLET_STORAGE_KEY', 'wallet');
  const profileKey = readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_PROFILE_STORAGE_KEY', 'profile');

  if (typeof session.name === 'string') primaryStorage.setItem(nameKey, session.name);
  if (typeof session.email === 'string') primaryStorage.setItem(emailKey, session.email);
  if (typeof session.wallet === 'string') primaryStorage.setItem(walletKey, session.wallet);
  if (session.profile !== undefined && session.profile !== null) primaryStorage.setItem(profileKey, String(session.profile));

  primaryStorage.setItem(FMZ_CURRENT_ACCESS_STORAGE_KEY, JSON.stringify({
    roleKeys: session.roleKeys ?? [],
    permissionKeys: session.permissionKeys ?? [],
    accessiblePages: session.accessiblePages ?? [],
    isAdmin: Boolean(session.isAdmin),
  }));
  primaryStorage.setItem(FMZ_AUTH_PERSISTENCE_KEY, mode);

  notifyFirmezaSessionChanged();
}

export function getFirmezaCurrentAccessSnapshot(): Record<string, unknown> | null {
  if (!isBrowser()) return null;

  try {
    const rawSnapshot = getStoredValue(FMZ_CURRENT_ACCESS_STORAGE_KEY);
    return rawSnapshot ? JSON.parse(rawSnapshot) as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function clearFirmezaSession(): void {
  if (!isBrowser()) return;

  const keysToClear = [FMZ_AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY, ...FMZ_USER_STORAGE_KEYS, FMZ_AUTH_PERSISTENCE_KEY];
  const hadStoredSessionData = keysToClear.some((key) => localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null);

  if (!hadStoredSessionData) return;

  keysToClear.forEach(removeFromBothStorages);
  notifyFirmezaSessionChanged();
}

export function hasFirmezaSession(): boolean {
  return Boolean(getFirmezaAccessToken());
}
