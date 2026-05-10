import { firmezaApiClient } from './firmeza-api-client';
import { setFirmezaAuthenticatedUserSession } from './auth/auth-storage';
import { normalizeFmzApiError, type FmzNormalizedApiError } from '../features/api-errors/domain';
import type { FmzAccessControlPage } from '../features/access-control/domain';

export type LoginType = {
  email: string;
  password: string;
};

export type UserType = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  birthdate?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  wallet?: string;
  createdAt?: string;
  profile?: number;
  roles?: string[];
  roleKeys?: string[];
  permissions?: string[];
  permissionKeys?: string[];
  accessiblePages?: FmzAccessControlPage[];
  isAdmin?: boolean;
};

export type RequestPasswordResetType = {
  email: string;
};

export type ResetPasswordType = {
  token: string;
  password: string;
  confirmPassword: string;
};

type FmzApiSuccess<T> = T & {
  success: true;
  message: string;
};

type FmzApiFailure = {
  success: false;
  error: FmzNormalizedApiError;
};

export type FmzApiResult<T> = FmzApiSuccess<T> | FmzApiFailure;

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

export type PasswordResetResponse = FmzApiResult<{}>;

export type ListUserResponse = {
  success: boolean;
  message: string;
  users?: UserType[];
  error?: FmzNormalizedApiError;
};


const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const normalizeKey = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const normalizeStringArray = (...values: unknown[]): string[] => {
  const normalizedValues = new Set<string>();

  const pushNormalized = (item: unknown) => {
    if (typeof item === 'string' || typeof item === 'number') {
      const nextValue = normalizeKey(item);
      if (nextValue) normalizedValues.add(nextValue);
      return;
    }

    const record = recordOf(item);
    const nextValue = normalizeKey(
      record.key
      ?? record.role_key
      ?? record.roleKey
      ?? record.permission_key
      ?? record.permissionKey
      ?? record.name
      ?? record.id,
    );
    if (nextValue) normalizedValues.add(nextValue);
  };

  values.forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach(pushNormalized);
      return;
    }

    pushNormalized(value);
  });

  return Array.from(normalizedValues);
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
    requiredPermission: normalizeKey(record.requiredPermission ?? record.required_permission_key ?? record.requiredPermissionKey),
  };
};

const normalizeAccessiblePages = (...values: unknown[]): FmzAccessControlPage[] => {
  const pagesByKey = new Map<string, FmzAccessControlPage>();

  values.forEach((value) => {
    if (!Array.isArray(value)) return;
    value.forEach((item) => {
      const page = normalizeAccessiblePage(item);
      if (page && !pagesByKey.has(page.key)) pagesByKey.set(page.key, page);
    });
  });

  return Array.from(pagesByKey.values()).sort((left, right) => left.order - right.order);
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
  const isAdmin = Boolean(user.isAdmin ?? user.is_admin ?? record.isAdmin ?? record.is_admin) || roleKeys.includes('admin') || accessiblePages.some((page) => page.key.startsWith('admin.'));

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

const getSuccessMessage = (data: Record<string, unknown>, fallback: string): string => (
  String(data.message || data.msg || fallback)
);

export async function login(user: LoginType): Promise<LoginResponse> {
  try {
    const response = await firmezaApiClient.post('/login', {
      email: user.email,
      password: user.password,
    });

    const normalizedPayload = normalizeLoginPayload(response.data, user.email);

    setFirmezaAuthenticatedUserSession(normalizedPayload);

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

export async function requestPasswordReset(payload: RequestPasswordResetType): Promise<PasswordResetResponse> {
  try {
    const response = await firmezaApiClient.post('/requestPasswordReset', {
      email: payload.email,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Enviamos as instruções para redefinir sua senha.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function resetPassword(payload: ResetPasswordType): Promise<PasswordResetResponse> {
  try {
    const response = await firmezaApiClient.post('/resetPassword', {
      token: payload.token,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Senha redefinida com sucesso.'),
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}

export async function listUser(): Promise<ListUserResponse> {
  try {
    const response = await firmezaApiClient.get('/listUsers');

    return {
      success: true,
      message: '',
      users: response.data.users,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Não foi possível carregar a lista de usuários.',
      error: normalizeFmzApiError(error),
    };
  }
}

export async function getUserByWallet(wallet: string): Promise<UserType | null> {
  if (!wallet) return null;

  try {
    const response = await firmezaApiClient.post('/getUserByWallet', { wallet });
    return response.data?.user ?? null;
  } catch {
    return null;
  }
}

export type UpdateUserResponse = FmzApiResult<{
  data?: {
    user?: UserType;
  };
}>;

export async function updateUser(user: UserType): Promise<UpdateUserResponse> {
  try {
    const response = await firmezaApiClient.put('/updateUser', {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      phoneCountry: user.phoneCountry,
      birthdate: user.birthdate,
      address: user.address,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      district: user.district,
      city: user.city,
      state: user.state,
      postalCode: user.postalCode,
      country: user.country,
      ...(user.currentPassword?.trim() || user.newPassword?.trim() || user.confirmPassword?.trim() ? {
        currentPassword: user.currentPassword,
        newPassword: user.newPassword,
        confirmPassword: user.confirmPassword,
      } : {}),
    });

    return {
      success: true,
      message: getSuccessMessage(response.data, 'Usuário atualizado com sucesso.'),
      data: response.data as { user?: UserType },
    };
  } catch (error) {
    return { success: false, error: normalizeFmzApiError(error) };
  }
}
