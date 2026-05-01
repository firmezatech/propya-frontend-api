const FMZ_AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY || "fmz_access_token";
const LEGACY_AUTH_TOKEN_KEY = "accessToken";
const FMZ_USER_STORAGE_KEYS = ["name", "wallet", "profile"];

const isBrowser = () => typeof window !== "undefined";

export function getFirmezaAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(FMZ_AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
}

export function setFirmezaAccessToken(accessToken: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(FMZ_AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, accessToken);
}

export function clearFirmezaSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(FMZ_AUTH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  FMZ_USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("walletChanged"));
}

export function hasFirmezaSession(): boolean {
  return Boolean(getFirmezaAccessToken());
}
