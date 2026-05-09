'use client';

import { fmzPublicLayoutConfig } from '../../config/fmz-public-layout-config';
import { clearFirmezaSession } from './auth-storage';

export type PerformFirmezaLogoutParams = {
  router: { replace: (href: string) => void; refresh?: () => void };
  locale?: string;
  targetPath?: string;
  refresh?: boolean;
};

const normalizeFmzPath = (path: string): string => {
  const trimmedPath = path.trim();
  if (!trimmedPath) return '/';
  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
};

export const buildFmzLocalizedPublicPath = (locale: string | undefined, path: string): string => {
  const normalizedPath = normalizeFmzPath(path);
  const normalizedLocale = locale?.trim();
  if (!normalizedLocale) return normalizedPath;
  if (normalizedPath === '/') return `/${normalizedLocale}`;
  if (normalizedPath === `/${normalizedLocale}` || normalizedPath.startsWith(`/${normalizedLocale}/`)) return normalizedPath;
  return `/${normalizedLocale}${normalizedPath}`;
};

const clearFmzSessionStorage = (): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.clear();
  } catch {
    // Some browsers can block storage access in strict privacy mode.
  }
};

const clearFmzClientCookies = (): void => {
  if (typeof document === 'undefined') return;

  const cookieNames = [
    'fmz_access_token',
    'accessToken',
    'token',
    'auth_token',
    'Authorization',
  ];

  cookieNames.forEach((cookieName) => {
    document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${cookieName}=; Max-Age=0; path=/connected; SameSite=Lax`;
  });
};

export const performFirmezaLogout = ({
  router,
  locale,
  targetPath = fmzPublicLayoutConfig.homePath,
  refresh = true,
}: PerformFirmezaLogoutParams): void => {
  clearFirmezaSession();
  clearFmzSessionStorage();
  clearFmzClientCookies();

  const nextPath = buildFmzLocalizedPublicPath(locale, targetPath);
  router.replace(nextPath);

  if (refresh) {
    window.setTimeout(() => {
      router.refresh?.();
    }, 0);
  }

  window.setTimeout(() => {
    if (window.location.pathname.includes('/connected')) {
      window.location.replace(nextPath);
    }
  }, 120);
};
