import { fmzAdminNavigationConfig } from '../../../config/fmz-admin-navigation-config';
import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { getFirmezaCurrentAccessSnapshot } from '../../../services/auth/auth-storage';
import type { FmzAccessControlPage, FmzAccessControlPrincipal } from '../domain';

const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const numberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
};

const booleanValue = (value: unknown, fallback = true): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'nao', 'não'].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeKey = (value: string): string => value.trim().toLowerCase();

// Derives the local part of an email ("mirella@x.com" → "mirella"), or '' when absent.
const emailPrefix = (email: string): string => {
  const trimmed = email.trim();
  if (!trimmed.includes('@')) return '';
  return trimmed.split('@')[0]?.trim() ?? '';
};

const pushNormalized = (target: Set<string>, value: unknown): void => {
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = normalizeKey(String(value));
    if (normalized) target.add(normalized);
    return;
  }

  const record = recordOf(value);
  const key = str(record.role_key, str(record.roleKey, str(record.key, str(record.name, str(record.id)))));
  const normalized = normalizeKey(key);
  if (normalized) target.add(normalized);
};

const stringArray = (...values: unknown[]): string[] => {
  const nextValues = new Set<string>();

  values.forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => pushNormalized(nextValues, item));
      return;
    }
    pushNormalized(nextValues, value);
  });

  return Array.from(nextValues);
};

const normalizeAccessPage = (page: unknown): FmzAccessControlPage => {
  const record = recordOf(page);
  const key = normalizeKey(str(record.key, str(record.page_key, str(record.pageKey, str(record.id, str(record.path))))));
  const label = str(record.label, str(record.name, key));
  const path = str(record.path, '#');

  return {
    id: str(record.id, key),
    key,
    name: str(record.name, label),
    label,
    path,
    order: numberValue(record.order, numberValue(record.order_index, numberValue(record.orderIndex, 0))),
    requiredPermission: normalizeKey(str(record.requiredPermission, str(record.required_permission_key, str(record.requiredPermissionKey)))),
    showInDropdown: booleanValue(record.showInDropdown ?? record.show_in_dropdown ?? record.isMenuVisible ?? record.is_menu_visible ?? record.includeInDropdown ?? record.include_in_dropdown, true),
  };
};

const pageArray = (value: unknown): FmzAccessControlPage[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeAccessPage).filter((page) => Boolean(page.key));
};

const normalizeCurrentAccessPrincipal = (payload: unknown): FmzAccessControlPrincipal => {
  const record = recordOf(payload);
  const user = recordOf(record.user ?? record.principal ?? record.data ?? record);
  const accessiblePages = pageArray(user.accessiblePages ?? user.pages ?? record.accessiblePages ?? record.pages);
  const roleKeys = stringArray(user.roleKeys, user.roles, user.role, user.primaryRoleKey, user.primary_role_key, record.roleKeys, record.roles, record.role);
  const permissionKeys = stringArray(user.permissionKeys, user.permissions, record.permissionKeys, record.permissions);
  const hasAdminPage = accessiblePages.some((page) => page.key.startsWith('admin.'));

  const email = str(user.email, str(record.email, ''));
  // Display name priority: standardized backend identity → legacy aliases → email prefix.
  // Never falls back to a brand/product name.
  const displayName = str(
    user.displayName,
    str(user.name, str(user.fullName, str(user.full_name,
      str(record.name, str(record.fullName, str(record.full_name, emailPrefix(email))))))),
  );

  return {
    id: str(user.id, str(user.userId, str(user.email))),
    name: displayName,
    displayName,
    email,
    initials: str(user.initials, ''),
    permissionKeys,
    roleKeys,
    accessiblePages,
    isAdmin: Boolean(user.isAdmin ?? user.is_admin ?? record.isAdmin ?? record.is_admin) || roleKeys.includes('admin') || hasAdminPage,
  };
};

const getStorageValue = (key: string): string => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) ?? '';
};

const buildCurrentAccessPrincipalFromSnapshot = (): FmzAccessControlPrincipal | null => {
  const snapshot = getFirmezaCurrentAccessSnapshot();
  if (!snapshot) return null;

  const principal = normalizeCurrentAccessPrincipal({
    ...snapshot,
    name: getStorageValue(process.env.NEXT_PUBLIC_FMZ_CONNECTED_USER_NAME_STORAGE_KEY || 'name'),
    email: getStorageValue(process.env.NEXT_PUBLIC_FMZ_CONNECTED_USER_EMAIL_STORAGE_KEY || 'email'),
  });

  const hasMeaningfulAccess = principal.roleKeys.length > 0 || principal.permissionKeys.length > 0 || principal.accessiblePages.length > 0;
  return hasMeaningfulAccess ? principal : null;
};

export async function getCurrentAccessControlPrincipal(): Promise<FmzAccessControlPrincipal> {
  try {
    const { data } = await firmezaApiClient.get(fmzAdminNavigationConfig.currentUserAccessPath);
    return normalizeCurrentAccessPrincipal(data);
  } catch (error) {
    const snapshotPrincipal = buildCurrentAccessPrincipalFromSnapshot();
    if (snapshotPrincipal) return snapshotPrincipal;
    throw error;
  }
}
