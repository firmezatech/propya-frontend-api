const readPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const FMZ_AUTH_SESSION_CHANGED_EVENT = 'fmzAuthSessionChanged';

const FMZ_AUTH_TOKEN_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY', 'fmz_access_token');
const LEGACY_AUTH_TOKEN_KEY = readPublicEnvValue('NEXT_PUBLIC_FMZ_LEGACY_AUTH_TOKEN_STORAGE_KEY', 'accessToken');
const FMZ_USER_STORAGE_KEYS = [
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_NAME_STORAGE_KEY', 'name'),
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_EMAIL_STORAGE_KEY', 'email'),
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_WALLET_STORAGE_KEY', 'wallet'),
  readPublicEnvValue('NEXT_PUBLIC_FMZ_CONNECTED_USER_PROFILE_STORAGE_KEY', 'profile'),
] as const;

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

export function clearFirmezaSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(FMZ_AUTH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  FMZ_USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  notifyFirmezaSessionChanged();
}

export function hasFirmezaSession(): boolean {
  return Boolean(getFirmezaAccessToken());
}
