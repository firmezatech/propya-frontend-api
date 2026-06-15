import { Activity, Building2, Coins, FileText, Home, LucideIcon, Mail, ReceiptText, Receipt, ScanFace, ShieldCheck, SlidersHorizontal, UserRound, Wrench } from 'lucide-react';
import { fmzPublicLayoutConfig } from './fmz-public-layout-config';
import { getPublicEnvValue } from '../lib/fmz-env';

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
  'admin.invoices': ReceiptText,
  'admin.invoice.detail': ReceiptText,
  'admin.invoice.upload': ReceiptText,
  'admin.maintenances': Wrench,
  'admin.contracts': FileText,
  'admin.contract.upload': FileText,
  'admin.rent.adjustment': FileText,
  'admin.tenant_settings': SlidersHorizontal,
  'admin.gas': Activity,
  'admin.rent_charges': Receipt,
  'admin.kyc': ScanFace,
  'admin.token_orders': Coins,
  'admin.email_sending': Mail,
  'admin.email_logs': Mail,
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
      id: 'admin.invoices',
      pageKey: 'admin.invoices',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_LABEL', 'Faturas'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_INVOICES_PATH', '/connected/invoicesAdmin'),
      requiredPermissionKey: 'admin.invoices.view',
      icon: ReceiptText,
    },
    {
      id: 'admin.contract.upload',
      pageKey: 'admin.contract.upload',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_CONTRACTS_LABEL', 'Gestão de Contratos'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_CONTRACTS_PATH', '/connected/contracts-management'),
      requiredPermissionKey: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_CONTRACTS_PERMISSION', 'admin.contracts.manage'),
      icon: FileText,
    },
    {
      id: 'admin.maintenance',
      pageKey: 'admin.maintenances',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_LABEL', 'Manutenções'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_MAINTENANCE_PATH', '/connected/maintenancesAdmin'),
      requiredPermissionKey: 'admin.maintenances.view',
      icon: Wrench,
    },
    {
      id: 'admin.tenant_settings',
      pageKey: 'admin.tenant_settings',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_TENANT_SETTINGS_LABEL', 'Parâmetros'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_TENANT_SETTINGS_PATH', '/connected/platform-settings'),
      requiredPermissionKey: 'admin.tenant_settings.view',
      icon: SlidersHorizontal,
    },
    {
      id: 'admin.rent_charges',
      pageKey: 'admin.rent_charges',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_RENT_CHARGES_LABEL', 'Boletos de Aluguel'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_RENT_CHARGES_PATH', '/connected/admin-rent-charges'),
      requiredPermissionKey: 'admin.rent_charges.view',
      icon: Receipt,
    },
    {
      id: 'admin.kyc',
      pageKey: 'admin.kyc',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_KYC_LABEL', 'Verificação de Identidade'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_KYC_PATH', '/connected/admin-kyc'),
      requiredPermissionKey: 'admin.kyc.users.view',
      icon: ScanFace,
    },
    {
      id: 'admin.token_orders',
      pageKey: 'admin.token_orders',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_TOKEN_ORDERS_LABEL', 'Compras de Tokens'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_TOKEN_ORDERS_PATH', '/connected/admin-token-orders'),
      requiredPermissionKey: 'admin.token_orders.view',
      icon: Coins,
    },
    {
      id: 'admin.email_sending',
      pageKey: 'admin.email_sending',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_EMAIL_SENDING_LABEL', 'E-mails'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_EMAIL_SENDING_PATH', '/connected/admin-emails'),
      requiredPermissionKey: 'admin.emails.send',
      icon: Mail,
    },
    {
      id: 'admin.email_logs',
      pageKey: 'admin.email_logs',
      label: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_EMAIL_LOGS_LABEL', 'Histórico de E-mails'),
      href: getPublicEnvValue('NEXT_PUBLIC_FMZ_ADMIN_EMAIL_LOGS_PATH', '/connected/admin-email-logs'),
      requiredPermissionKey: 'admin.emails.send',
      icon: Mail,
    },
  ] satisfies FmzAdminNavigationItem[],
} as const;

export const fmzAdminNavigationPaths = fmzAdminNavigationConfig.items.map((item) => item.href);
