import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { setFirmezaAuthenticatedUserSession } from '../../../services/auth/auth-storage';
import { normalizeFmzApiError } from '../../api-errors/domain';
import type { FmzApiResult } from '../../api-errors/domain';
import type { FmzAccessControlPage } from '../../access-control/domain';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginType = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginResponse = FmzApiResult<{
  accessToken?: string;
  wallet?: string;
  name?: string;
  profile?: number;
  roles?: string[];
  roleKeys?: string[];
  permissions?: string[];
  permissionKeys?: string[];
  accessiblePages?: FmzAccessControlPage[];
  isAdmin?: boolean;
}>;

export type CreateUserPayload = {
  name: string;
  email: string;
  phone: string;
  phoneCountry: string;
  birthdate: string;
  password: string;
  confirmPassword: string;
};

export type CreateUserResponse = FmzApiResult<{}>;


// ─── Normalizer (private) ────────────────────────────────────────────────────

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const normalizeKey = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase();

const normalizeBoolean = (value: unknown, fallback = true): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'sim'].includes(v)) return true;
    if (['false', '0', 'no', 'n', 'nao', 'não'].includes(v)) return false;
  }
  return fallback;
};

const normalizeStringArray = (...values: unknown[]): string[] => {
  const seen = new Set<string>();

  const collect = (item: unknown) => {
    if (typeof item === 'string' || typeof item === 'number') {
      const v = normalizeKey(item);
      if (v) seen.add(v);
      return;
    }
    const record = recordOf(item);
    const v = normalizeKey(
      record.key ?? record.role_key ?? record.roleKey ??
      record.permission_key ?? record.permissionKey ??
      record.name ?? record.id,
    );
    if (v) seen.add(v);
  };

  for (const value of values) {
    if (Array.isArray(value)) value.forEach(collect);
    else collect(value);
  }

  return Array.from(seen);
};

const normalizeAccessiblePage = (page: unknown): FmzAccessControlPage | null => {
  const record = recordOf(page);
  const key = normalizeKey(record.key ?? record.page_key ?? record.pageKey ?? record.id ?? record.path);
  const path = String(record.path ?? '').trim();
  if (!key || !path) return null;

  return {
    id: String(record.id ?? key),
    key,
    name: String(record.name ?? record.label ?? key),
    label: String(record.label ?? record.name ?? key),
    path,
    order: Number(record.order ?? record.order_index ?? record.orderIndex ?? 0) || 0,
    requiredPermission: normalizeKey(
      record.requiredPermission ?? record.required_permission_key ?? record.requiredPermissionKey,
    ),
    showInDropdown: normalizeBoolean(
      record.showInDropdown ?? record.show_in_dropdown ?? record.isMenuVisible ??
      record.is_menu_visible ?? record.includeInDropdown ?? record.include_in_dropdown,
      true,
    ),
  };
};

const normalizeAccessiblePages = (...values: unknown[]): FmzAccessControlPage[] => {
  const byKey = new Map<string, FmzAccessControlPage>();

  for (const value of values) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const page = normalizeAccessiblePage(item);
      if (page && !byKey.has(page.key)) byKey.set(page.key, page);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.order - b.order);
};

const normalizeLoginPayload = (payload: unknown, fallbackEmail: string) => {
  const record = recordOf(payload);
  const user = recordOf(record.user ?? record.data ?? record.principal ?? record);
  const accessToken = String(record.accessToken ?? record.token ?? user.accessToken ?? user.token ?? '');
  const wallet = String(user.wallet ?? user.walletAddress ?? user.wallet_address ?? record.wallet ?? '');
  const name = String(user.name ?? user.fullName ?? user.full_name ?? record.name ?? '');
  const email = String(user.email ?? record.email ?? fallbackEmail);
  const profile = Number(user.profile ?? record.profile);
  const roleKeys = normalizeStringArray(user.roleKeys, user.roles, user.role, record.roleKeys, record.roles, record.role);
  const permissionKeys = normalizeStringArray(user.permissionKeys, user.permissions, record.permissionKeys, record.permissions);
  const accessiblePages = normalizeAccessiblePages(user.accessiblePages, user.pages, record.accessiblePages, record.pages);
  const isAdmin =
    Boolean(user.isAdmin ?? user.is_admin ?? record.isAdmin ?? record.is_admin) ||
    roleKeys.includes('admin') ||
    accessiblePages.some((page) => page.key.startsWith('admin.'));

  return {
    accessToken: accessToken || undefined,
    wallet,
    name,
    email,
    profile: Number.isFinite(profile) ? profile : undefined,
    roles: roleKeys,
    roleKeys,
    permissions: permissionKeys,
    permissionKeys,
    accessiblePages,
    isAdmin,
  };
};

const getSuccessMessage = (data: Record<string, unknown>, fallback: string): string =>
  String(data.message || data.msg || fallback);

// ─── API ──────────────────────────────────────────────────────────────────────

export async function login(user: LoginType): Promise<LoginResponse> {
  try {
    const response = await firmezaApiClient.post('/login', {
      email: user.email,
      password: user.password,
    });

    const normalizedPayload = normalizeLoginPayload(response.data, user.email);
    setFirmezaAuthenticatedUserSession(normalizedPayload, { rememberMe: user.rememberMe ?? true });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Login realizado com sucesso.'),
      ...normalizedPayload,
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function createUser(user: CreateUserPayload): Promise<CreateUserResponse> {
  try {
    const response = await firmezaApiClient.post('/createUser', {
      name: user.name,
      email: user.email,
      phone: user.phone,
      phoneCountry: user.phoneCountry,
      birthdate: user.birthdate,
      password: user.password,
      confirmPassword: user.confirmPassword,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Usuário criado com sucesso.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

