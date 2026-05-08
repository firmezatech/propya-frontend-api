import { BarChart3, Building2, FileText, Home, LucideIcon, ReceiptText, ShieldCheck, UserRound, UsersRound, Wrench } from 'lucide-react';
import { fmzPublicLayoutConfig } from './fmz-public-layout-config';

const getPublicEnvValue = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export type FmzAdminNavigationItem = {
  id: string;
  pageKey: string;
  label: string;
  href: string;
  requiredPermissionKey: string;
  icon: LucideIcon;
};

export const fmzAdminPageIconByKey: Record<string, LucideIcon> = {
  'admin.dashboard': Home,
  'admin.users': UserRound,
  'admin.roles': ShieldCheck,
  'admin.properties': Building2,
  'admin.reports.payments_investor': BarChart3,
  'admin.invoices': ReceiptText,
  'admin.invoice.detail': ReceiptText,
  'admin.invoice.upload': ReceiptText,
  'admin.maintenances': Wrench,
  'admin.contacts': UsersRound,
  'admin.gas': Building2,
  'admin.investors': UsersRound,
  'admin.contracts': FileText,
  'admin.rent.adjustment': FileText,
};

export const fmzAdminNavigationConfig = {
  currentUserAccessPath: getPublicEnvValue('NEXT_PUBLIC_FMZ_CURRENT_ACCESS_PATH', '/me/access'),
  sectionLabel: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_SIDEBAR_SECTION_LABEL', 'Principal'),
  // Fallback only while current access is loading. The actual sidebar must be
  // rendered from backend accessiblePages, whose fields come from admin_panel.pages.
  items: [
    {
      id: 'admin.dashboard',
      pageKey: 'admin.dashboard',
      label: fmzPublicLayoutConfig.connectedDashboardLabel,
      href: fmzPublicLayoutConfig.connectedDashboardPath,
      requiredPermissionKey: 'admin.dashboard.view',
      icon: Home,
    },
    {
      id: 'admin.users',
      pageKey: 'admin.users',
      label: fmzPublicLayoutConfig.connectedAdminUsersLabel,
      href: fmzPublicLayoutConfig.connectedAdminUsersPath,
      requiredPermissionKey: 'admin.users.view',
      icon: UserRound,
    },
    {
      id: 'admin.roles',
      pageKey: 'admin.roles',
      label: fmzPublicLayoutConfig.connectedAdminRolesLabel,
      href: fmzPublicLayoutConfig.connectedAdminRolesPath,
      requiredPermissionKey: 'admin.roles.view',
      icon: ShieldCheck,
    },
    {
      id: 'admin.properties',
      pageKey: 'admin.properties',
      label: fmzPublicLayoutConfig.connectedAdminPropertiesLabel,
      href: fmzPublicLayoutConfig.connectedAdminPropertiesPath,
      requiredPermissionKey: 'admin.properties.view',
      icon: Building2,
    },
    {
      id: 'admin.reports.payments_investor',
      pageKey: 'admin.reports.payments_investor',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_REPORTS_LABEL', 'Relatórios'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_REPORTS_PATH', '/connected/reportAdminPaymentsInvestor'),
      requiredPermissionKey: 'admin.reports.view',
      icon: BarChart3,
    },
    {
      id: 'admin.invoices',
      pageKey: 'admin.invoices',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_LABEL', 'Faturas'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_PATH', '/connected/invoicesAdmin'),
      requiredPermissionKey: 'admin.invoices.view',
      icon: ReceiptText,
    },
    {
      id: 'admin.maintenance',
      pageKey: 'admin.maintenances',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_LABEL', 'Manutenções'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_PATH', '/connected/maintenancesAdmin'),
      requiredPermissionKey: 'admin.maintenances.view',
      icon: Wrench,
    },
  ] satisfies FmzAdminNavigationItem[],
} as const;

export const fmzAdminNavigationPaths = fmzAdminNavigationConfig.items.map((item) => item.href);
