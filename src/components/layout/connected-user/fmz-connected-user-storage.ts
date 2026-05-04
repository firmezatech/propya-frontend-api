import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import type { FmzConnectedUserSummary } from './fmz-connected-user.types';

const isBrowser = (): boolean => typeof window !== 'undefined';

const readStorageValue = (key: string, fallback = ''): string => {
  if (!isBrowser()) return fallback;
  return localStorage.getItem(key)?.trim() || fallback;
};

export const buildFmzConnectedUserInitials = (name: string): string => {
  const nameParts = name.split(' ').map((part) => part.trim()).filter(Boolean);
  const firstInitial = nameParts[0]?.[0] ?? 'F';
  const secondInitial = nameParts[1]?.[0] ?? nameParts[0]?.[1] ?? 'T';
  return `${firstInitial}${secondInitial}`.toUpperCase();
};

export const buildFmzConnectedUserSummary = (): FmzConnectedUserSummary => {
  const name = readStorageValue(fmzPublicLayoutConfig.connectedUserNameStorageKey, fmzPublicLayoutConfig.defaultConnectedUserName);
  const email = readStorageValue(
    fmzPublicLayoutConfig.connectedUserEmailStorageKey,
    readStorageValue(fmzPublicLayoutConfig.connectedUserWalletStorageKey, fmzPublicLayoutConfig.defaultConnectedUserEmail),
  );

  return {
    name,
    email,
    initials: buildFmzConnectedUserInitials(name),
  };
};
