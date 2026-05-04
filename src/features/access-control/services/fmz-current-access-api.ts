import { fmzAdminNavigationConfig } from '../../../config/fmz-admin-navigation-config';
import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { FmzAccessControlPrincipal } from '../domain';

const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.map((item) => {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  const record = recordOf(item);
  return str(record.key, str(record.id, str(record.name)));
}).filter(Boolean) : [];

const normalizeCurrentAccessPrincipal = (payload: unknown): FmzAccessControlPrincipal => {
  const record = recordOf(payload);
  const user = recordOf(record.user ?? record.principal ?? record.data ?? record);
  return {
    id: str(user.id, str(user.userId, str(user.email))),
    name: str(user.name, str(user.fullName, '')),
    email: str(user.email, ''),
    permissionKeys: stringArray(user.permissionKeys ?? user.permissions ?? record.permissionKeys ?? record.permissions),
    roleKeys: stringArray(user.roleKeys ?? user.roles ?? record.roleKeys ?? record.roles),
    isAdmin: Boolean(user.isAdmin ?? record.isAdmin),
  };
};

export async function getCurrentAccessControlPrincipal(): Promise<FmzAccessControlPrincipal> {
  const { data } = await firmezaApiClient.get(fmzAdminNavigationConfig.currentUserAccessPath);
  return normalizeCurrentAccessPrincipal(data);
}
