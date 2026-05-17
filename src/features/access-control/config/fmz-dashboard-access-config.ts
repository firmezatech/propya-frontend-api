export type FmzDashboardKind = 'admin' | 'renter';

export type FmzDashboardAccessRule = {
  kind: FmzDashboardKind;
  roleKeys: string[];
  permissionKeys: string[];
  pageKeys: string[];
};

const csv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const getPublicEnvCsv = (key: string, fallback: string): string[] => {
  const value = process.env[key];
  return csv(value && value.trim().length > 0 ? value : fallback);
};

/**
 * Dashboard routing is intentionally aligned with admin_panel schema/view fields:
 * - admin_panel.roles.role_key is exposed by backend as role / roles / roleKeys
 * - admin_panel.permissions.permission_key is exposed as permissionKeys
 * - admin_panel.pages.page_key is exposed inside accessiblePages[].key
 *
 * Page and permission keys are the strongest source of truth because the backend
 * already resolves role -> permissions -> pages. Role keys are kept only as a
 * fallback for dashboards that still do not have a dedicated page in the catalog.
 */
export const fmzDashboardAccessConfig = {
  rules: [
    {
      kind: 'admin',
      roleKeys: getPublicEnvCsv('NEXT_PUBLIC_FMZ_ADMIN_ROLE_KEYS', 'admin'),
      permissionKeys: getPublicEnvCsv('NEXT_PUBLIC_FMZ_ADMIN_DASHBOARD_PERMISSIONS', 'admin.dashboard.view'),
      pageKeys: getPublicEnvCsv('NEXT_PUBLIC_FMZ_ADMIN_DASHBOARD_PAGE_KEYS', 'admin.dashboard'),
    },
    {
      kind: 'renter',
      roleKeys: getPublicEnvCsv('NEXT_PUBLIC_FMZ_RENTER_ROLE_KEYS', 'tenant'),
      permissionKeys: getPublicEnvCsv('NEXT_PUBLIC_FMZ_RENTER_DASHBOARD_PERMISSIONS', 'tenant.dashboard.view'),
      pageKeys: getPublicEnvCsv('NEXT_PUBLIC_FMZ_RENTER_DASHBOARD_PAGE_KEYS', 'tenant.dashboard'),
    },
  ] satisfies FmzDashboardAccessRule[],
} as const;
