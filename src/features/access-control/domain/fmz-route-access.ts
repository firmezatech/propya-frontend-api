import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import type { FmzAccessControlPage, FmzAccessControlPrincipal } from './fmz-access-control.types';

const LOCALE_PREFIX_PATTERN = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/;

export const normalizeFmzPath = (path: string | null | undefined): string => {
  if (!path) return '/';
  const cleanPath = path.split('?')[0]?.split('#')[0] || '/';
  const withoutLocale = cleanPath.replace(LOCALE_PREFIX_PATTERN, '') || '/';
  const withoutTrailingSlash = withoutLocale.length > 1 ? withoutLocale.replace(/\/+$/, '') : withoutLocale;
  return withoutTrailingSlash || '/';
};

const isWildcardSegment = (segment: string): boolean => segment.startsWith('[') && segment.endsWith(']');

const matchDynamicPath = (allowedPath: string, currentPath: string): boolean => {
  const allowedSegments = normalizeFmzPath(allowedPath).split('/').filter(Boolean);
  const currentSegments = normalizeFmzPath(currentPath).split('/').filter(Boolean);

  if (!allowedSegments.some(isWildcardSegment)) return false;
  if (allowedSegments.length !== currentSegments.length) return false;

  return allowedSegments.every((segment, index) => isWildcardSegment(segment) || segment === currentSegments[index]);
};

const CONNECTED_SYSTEM_BYPASS_PATHS = [
  fmzPublicLayoutConfig.connectedLogoutPath,
  '/connected/tokens-to-purchase-pix',
] as const;

export const isFmzConnectedSystemBypassPath = (pathname: string | null | undefined): boolean => {
  const currentPath = normalizeFmzPath(pathname);
  return CONNECTED_SYSTEM_BYPASS_PATHS.some((path) => {
    const normalizedPath = normalizeFmzPath(path);
    return currentPath === normalizedPath || currentPath.startsWith(`${normalizedPath}/`);
  });
};

export const canAccessFmzPath = (
  principal: FmzAccessControlPrincipal | null | undefined,
  pathname: string | null | undefined,
): boolean => {
  if (!principal) return false;
  const currentPath = normalizeFmzPath(pathname);

  if (isFmzConnectedSystemBypassPath(currentPath)) return true;

  return (principal.accessiblePages ?? []).some((page) => {
    const allowedPath = normalizeFmzPath(page.path);
    if (!allowedPath || allowedPath === '#' || allowedPath === '/') return false;
    return currentPath === allowedPath || currentPath.startsWith(`${allowedPath}/`) || matchDynamicPath(allowedPath, currentPath);
  });
};

const pageCanBeRedirectTarget = (page: FmzAccessControlPage): boolean => {
  const path = normalizeFmzPath(page.path);
  return Boolean(page.key && path && path !== '#' && path !== '/' && !path.includes('['));
};

export const resolveFirstAccessibleFmzPath = (principal: FmzAccessControlPrincipal | null | undefined): string | null => {
  if (!principal?.accessiblePages?.length) return null;

  const sortedPages = [...principal.accessiblePages]
    .filter(pageCanBeRedirectTarget)
    .sort((left, right) => left.order - right.order);

  const dashboardPath = normalizeFmzPath(fmzPublicLayoutConfig.connectedDashboardPath);
  const dashboardPage = sortedPages.find((page) => normalizeFmzPath(page.path) === dashboardPath);

  return normalizeFmzPath(dashboardPage?.path ?? sortedPages[0]?.path ?? null);
};

export const buildFmzLocalizedHref = (locale: string | undefined, href: string): string => `${locale ? `/${locale}` : ''}${normalizeFmzPath(href)}`;
