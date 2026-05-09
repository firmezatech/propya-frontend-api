import { fmzDashboardAccessConfig, type FmzDashboardAccessRule, type FmzDashboardKind } from '../config/fmz-dashboard-access-config';
import type { FmzAccessControlPrincipal } from './fmz-access-control.types';

const normalizedSet = (values: readonly string[] | undefined): Set<string> =>
  new Set((values ?? []).map((value) => String(value).trim().toLowerCase()).filter(Boolean));

const intersects = (source: Set<string>, targets: readonly string[]): boolean =>
  targets.some((target) => source.has(target.trim().toLowerCase()));

const hasRequiredRoleForDashboard = (rule: FmzDashboardAccessRule, roleKeys: Set<string>): boolean => {
  if (rule.kind !== 'renter') return true;

  // Tenant dashboard is intentionally stricter than the shared /connected/dashboard route:
  // even if a non-tenant role receives tenant.dashboard.view or tenant.dashboard by mistake,
  // the renter experience must only render for an explicit tenant role.
  return intersects(roleKeys, rule.roleKeys);
};

const findDashboardKindBy = (
  principal: FmzAccessControlPrincipal,
  matcher: (rule: FmzDashboardAccessRule) => boolean,
): FmzDashboardKind | null => {
  const roleKeys = normalizedSet(principal.roleKeys);

  for (const rule of fmzDashboardAccessConfig.rules) {
    if (matcher(rule) && hasRequiredRoleForDashboard(rule, roleKeys)) return rule.kind;
  }

  return null;
};

export function resolveDashboardKindFromAccess(principal: FmzAccessControlPrincipal | null | undefined): FmzDashboardKind | null {
  if (!principal) return null;

  const roleKeys = normalizedSet(principal.roleKeys);
  const permissionKeys = normalizedSet(principal.permissionKeys);
  const pageKeys = normalizedSet(principal.accessiblePages?.map((page) => page.key));

  // Backend-resolved pages are the source of truth. Do not infer dashboard by path,
  // because /connected/dashboard can be shared by multiple roles.
  const byPage = findDashboardKindBy(principal, (rule) => intersects(pageKeys, rule.pageKeys));
  if (byPage) return byPage;

  const byPermission = findDashboardKindBy(principal, (rule) => intersects(permissionKeys, rule.permissionKeys));
  if (byPermission) return byPermission;

  // Role key fallback only. The preferred source is still accessiblePages.
  const byRole = findDashboardKindBy(principal, (rule) => intersects(roleKeys, rule.roleKeys));
  if (byRole) return byRole;

  return null;
}

export function hasAnyAccessPermission(principal: FmzAccessControlPrincipal | null | undefined, permissionKeys: readonly string[]): boolean {
  if (!principal) return false;
  const effectivePermissionKeys = normalizedSet(principal.permissionKeys);
  return permissionKeys.some((permissionKey) => effectivePermissionKeys.has(permissionKey.trim().toLowerCase()));
}

export function hasAccessiblePage(principal: FmzAccessControlPrincipal | null | undefined, pageKeys: readonly string[]): boolean {
  if (!principal) return false;
  const effectivePageKeys = normalizedSet(principal.accessiblePages.map((page) => page.key));
  return pageKeys.some((pageKey) => effectivePageKeys.has(pageKey.trim().toLowerCase()));
}

export function hasAdminAccessiblePage(principal: FmzAccessControlPrincipal | null | undefined): boolean {
  if (!principal) return false;
  return principal.accessiblePages.some((page) => page.key.trim().toLowerCase().startsWith('admin.'));
}

export type { FmzDashboardKind };
