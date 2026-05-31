import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import type { FmzConnectedUserSummary } from './fmz-connected-user.types';

const isBrowser = (): boolean => typeof window !== 'undefined';

const readStorageValue = (key: string, fallback = ''): string => {
  if (!isBrowser()) return fallback;
  return localStorage.getItem(key)?.trim() || fallback;
};

export const buildFmzConnectedUserInitials = (name: string): string => {
  const nameParts = name.split(' ').map((part) => part.trim()).filter(Boolean);
  // Neutral fallbacks ('U') — never echo a brand/product name's initials.
  const firstInitial = nameParts[0]?.[0] ?? 'U';
  const secondInitial = nameParts[1]?.[0] ?? nameParts[0]?.[1] ?? '';
  return `${firstInitial}${secondInitial}`.toUpperCase();
};

// Derives the local part of an email ("mirella@x.com" → "mirella"), or '' when absent.
const emailPrefix = (email: string): string => {
  const trimmed = email.trim();
  if (!trimmed.includes('@')) return '';
  return trimmed.split('@')[0]?.trim() ?? '';
};

export const readStoredConnectedUserName = (): string =>
  readStorageValue(fmzPublicLayoutConfig.connectedUserNameStorageKey, '');

export const readStoredConnectedUserEmail = (): string =>
  readStorageValue(
    fmzPublicLayoutConfig.connectedUserEmailStorageKey,
    readStorageValue(fmzPublicLayoutConfig.connectedUserWalletStorageKey, ''),
  );

export type ResolveConnectedUserSummaryInput = {
  /** Authenticated display name from the backend principal (highest priority). */
  principalName?: string | null;
  principalEmail?: string | null;
  principalInitials?: string | null;
  /** localStorage fallbacks — used only when the backend identity is unavailable. */
  storedName?: string | null;
  storedEmail?: string | null;
  defaultName?: string;
  defaultEmail?: string;
};

/**
 * Resolves the connected user summary from the backend identity first and
 * localStorage only as a fallback.
 *
 * Name priority:
 *   1. Backend principal name/displayName
 *   2. localStorage name
 *   3. email prefix (principal email, then stored email)
 *   4. neutral default ("Usuária") — never a brand/product name
 *
 * Pure function — no I/O. Callers pass already-read storage values so it stays testable.
 */
export const resolveConnectedUserSummary = ({
  principalName,
  principalEmail,
  principalInitials,
  storedName,
  storedEmail,
  defaultName = fmzPublicLayoutConfig.defaultConnectedUserName,
  defaultEmail = fmzPublicLayoutConfig.defaultConnectedUserEmail,
}: ResolveConnectedUserSummaryInput): FmzConnectedUserSummary => {
  const cleanPrincipalName = principalName?.trim() || '';
  const cleanStoredName = storedName?.trim() || '';
  const email = (principalEmail?.trim() || storedEmail?.trim() || '');

  const name =
    cleanPrincipalName ||
    cleanStoredName ||
    emailPrefix(email) ||
    defaultName;

  // Prefer backend-provided initials; otherwise derive them from the resolved name.
  const initials = principalInitials?.trim() || buildFmzConnectedUserInitials(name);

  return {
    name,
    email: email || defaultEmail,
    initials,
  };
};

// Backward-compatible localStorage-only summary (used where no backend principal is
// available, e.g. the admin identity chip). Delegates to the shared resolver.
export const buildFmzConnectedUserSummary = (): FmzConnectedUserSummary =>
  resolveConnectedUserSummary({
    storedName: readStoredConnectedUserName(),
    storedEmail: readStoredConnectedUserEmail(),
  });
