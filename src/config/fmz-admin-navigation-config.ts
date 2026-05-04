import { BarChart3, Building2, Home, ReceiptText, ShieldCheck, UserRound, Wrench } from 'lucide-react';
import { fmzPublicLayoutConfig } from './fmz-public-layout-config';

const getPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export type FmzAdminNavigationItem = {
  id: string;
  label: string;
  href: string;
  requiredPermissionKey: string;
  icon: typeof Home;
};

export const fmzAdminNavigationConfig = {
  currentUserAccessPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CURRENT_ACCESS_PATH', '/admin/access-control/me'),
  sectionLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_SIDEBAR_SECTION_LABEL', 'Principal'),
  items: [
    {
      id: 'dashboard',
      label: fmzPublicLayoutConfig.connectedDashboardLabel,
      href: fmzPublicLayoutConfig.connectedDashboardPath,
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_DASHBOARD_PERMISSION', 'dashboard.view'),
      icon: Home,
    },
    {
      id: 'users',
      label: fmzPublicLayoutConfig.connectedAdminUsersLabel,
      href: fmzPublicLayoutConfig.connectedAdminUsersPath,
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_USERS_PERMISSION', 'users.manage'),
      icon: UserRound,
    },
    {
      id: 'roles',
      label: fmzPublicLayoutConfig.connectedAdminRolesLabel,
      href: fmzPublicLayoutConfig.connectedAdminRolesPath,
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_ROLES_PERMISSION', 'roles.manage'),
      icon: ShieldCheck,
    },
    {
      id: 'properties',
      label: fmzPublicLayoutConfig.connectedAdminPropertiesLabel,
      href: fmzPublicLayoutConfig.connectedAdminPropertiesPath,
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_PROPERTIES_PERMISSION', 'properties.manage'),
      icon: Building2,
    },
    {
      id: 'reports',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_REPORTS_LABEL', 'Relatórios'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_REPORTS_PATH', '/connected/reportAdminPaymentsInvestor'),
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_REPORTS_PERMISSION', 'reports.view'),
      icon: BarChart3,
    },
    {
      id: 'invoices',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_LABEL', 'Faturas'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_PATH', '/connected/invoicesAdmin'),
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_PERMISSION', 'invoices.manage'),
      icon: ReceiptText,
    },
    {
      id: 'maintenance',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_LABEL', 'Manutenções'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_PATH', '/connected/maintenancesAdmin'),
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_PERMISSION', 'maintenance.manage'),
      icon: Wrench,
    },
  ] satisfies FmzAdminNavigationItem[],
} as const;

export const fmzAdminNavigationPaths = fmzAdminNavigationConfig.items.map((item) => item.href);
