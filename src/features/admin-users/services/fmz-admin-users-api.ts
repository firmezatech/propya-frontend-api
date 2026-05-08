import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { createUser, listUser, updateUser, type CreateUserPayload, type UserType } from '../../../services/login-fmz-api';
import { normalizeRole } from '../../access-control/services/fmz-access-control-api';
import type { FmzAccessControlRole } from '../../access-control/domain';
import type { FmzAdminUser, FmzAdminUserDraft } from '../domain';

const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const normalized = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const uniqueNormalizedArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const next = new Set<string>();
  value.forEach((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      const key = normalized(item);
      if (key) next.add(key);
      return;
    }
    const itemRecord = recordOf(item);
    const key = normalized(itemRecord.role_key ?? itemRecord.roleKey ?? itemRecord.key ?? itemRecord.name ?? itemRecord.id);
    if (key) next.add(key);
  });
  return Array.from(next);
};

const statusOf = (value: unknown): 'active' | 'inactive' => {
  if (typeof value === 'boolean') return value ? 'active' : 'inactive';
  const current = normalized(value);
  return current === 'inactive' || current === 'disabled' || current === 'false' ? 'inactive' : 'active';
};

export const normalizeAdminUser = (user: unknown): FmzAdminUser => {
  const record = recordOf(user);
  const id = str(record.id, str(record._id, str(record.userId, str(record.user_id, str(record.email)))));
  const firstName = str(record.firstName, str(record.first_name));
  const lastName = str(record.lastName, str(record.last_name));
  const name = str(record.name, str(record.fullName, str(record.full_name, [firstName, lastName].filter(Boolean).join(' '))));
  const roleKeys = uniqueNormalizedArray(record.roleKeys ?? record.roles ?? record.role_keys ?? record.userRoles ?? record.user_roles);

  return {
    id,
    name,
    email: str(record.email),
    phone: str(record.phone, str(record.phone_e164, str(record.phoneE164))),
    wallet: normalized(record.wallet ?? record.walletAddress ?? record.wallet_address),
    status: statusOf(record.status ?? record.isActive ?? record.is_active),
    roleKeys,
    createdAt: str(record.createdAt, str(record.created_at)),
  };
};

const adminUserPayload = (draft: FmzAdminUserDraft) => ({
  id: draft.id,
  _id: draft.id,
  name: draft.name,
  email: draft.email,
  phone: draft.phone,
  password: draft.password,
  confirmPassword: draft.password,
  status: draft.status,
  isActive: draft.status === 'active',
  is_active: draft.status === 'active',
  roleKeys: draft.roleKeys,
  roles: draft.roleKeys,
});

export async function getAdminUsers(): Promise<FmzAdminUser[]> {
  const legacyResponse = await listUser();
  if (!legacyResponse.success) throw legacyResponse.error ?? new Error(legacyResponse.message);
  return (legacyResponse.users ?? []).map(normalizeAdminUser).filter((user) => Boolean(user.id || user.email));
}

export async function getAdminUserRoles(): Promise<FmzAccessControlRole[]> {
  const { data } = await firmezaApiClient.get('/admin/access-control/roles');
  return (Array.isArray(data) ? data : data?.roles ?? data?.data ?? []).map(normalizeRole);
}

export async function createAdminUser(draft: FmzAdminUserDraft): Promise<void> {
  const password = draft.password ?? '';
  const payload: CreateUserPayload = {
    name: draft.name,
    email: draft.email,
    phone: draft.phone,
    phoneCountry: 'BR',
    birthdate: '',
    password,
    confirmPassword: password,
  };

  const response = await createUser(payload);
  if (!response.success) throw response.error;
  await updateAdminUserRoles(draft.email, draft.roleKeys, draft.status);
}

export async function updateAdminUser(draft: FmzAdminUserDraft): Promise<void> {
  const response = await updateUser({
    _id: draft.id,
    name: draft.name,
    email: draft.email,
    phone: draft.phone,
    newPassword: draft.password,
    confirmPassword: draft.password,
  } as UserType);
  if (!response.success) throw response.error;
  await updateAdminUserRoles(draft.id || draft.email, draft.roleKeys, draft.status);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await firmezaApiClient.delete(`/admin/users/${encodeURIComponent(userId)}`);
}

export async function updateAdminUserRoles(userIdOrEmail: string, roleKeys: string[], status: 'active' | 'inactive'): Promise<void> {
  if (!userIdOrEmail) return;
  try {
    await firmezaApiClient.patch(`/admin/users/${encodeURIComponent(userIdOrEmail)}/roles`, { roleKeys, roles: roleKeys, status, isActive: status === 'active' });
  } catch {
    await firmezaApiClient.patch(`/admin/access-control/users/${encodeURIComponent(userIdOrEmail)}/roles`, { roleKeys, roles: roleKeys, status, isActive: status === 'active' });
  }
}
