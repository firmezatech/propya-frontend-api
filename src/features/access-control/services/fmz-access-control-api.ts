import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { FmzAccessControlCatalog, FmzAccessControlPage, FmzAccessControlPermission, FmzAccessControlRole, FmzRolePayload } from '../domain';

const BASE_PATH = '/admin/access-control';
const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const numberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
};
const normalized = (value: string): string => value.trim().toLowerCase();

const arr = <T>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const record = recordOf(payload);
  for (const key of keys) if (Array.isArray(record[key])) return record[key] as T[];
  return record.data ? arr<T>(record.data, keys) : [];
};

const normalizePage = (page: unknown): FmzAccessControlPage => {
  const record = recordOf(page);
  const key = normalized(str(record.key, str(record.page_key, str(record.pageKey, str(record.id, str(record.path))))));
  const label = str(record.label, str(record.name, key));
  return {
    id: str(record.id, key),
    key,
    name: str(record.name, label),
    label,
    path: str(record.path, '#'),
    order: numberValue(record.order, numberValue(record.order_index, numberValue(record.orderIndex, 0))),
    requiredPermission: normalized(str(record.requiredPermission, str(record.required_permission_key, str(record.requiredPermissionKey)))),
  };
};

const normalizePageArray = (pages: unknown): FmzAccessControlPage[] => !Array.isArray(pages) ? [] : pages.map(normalizePage).filter((page) => Boolean(page.key));
const pageKeys = (pages: unknown): string[] => normalizePageArray(pages).map((page) => page.key);

const normalizePermission = (permission: unknown): FmzAccessControlPermission => {
  const record = recordOf(permission);
  const key = normalized(str(record.key, str(record.permission_key, str(record.permissionKey, str(record.id)))));
  const pages = normalizePageArray(record.pages);
  return {
    id: str(record.id, key),
    key,
    label: str(record.label, str(record.name, key)),
    description: str(record.description),
    pageKeys: pages.length ? pages.map((page) => page.key) : pageKeys(record.pageKeys ?? record.page_keys ?? record.pageIds),
    pages,
  };
};

const permissionKeys = (role: Record<string, unknown>): string[] => {
  const raw = role.permissionKeys ?? role.permissions ?? role.permKeys ?? role.permIds;
  return !Array.isArray(raw) ? [] : raw.map((permission) => {
    if (typeof permission === 'string' || typeof permission === 'number') return normalized(String(permission));
    const record = recordOf(permission);
    return normalized(str(record.key, str(record.permission_key, str(record.permissionKey, str(record.id)))));
  }).filter(Boolean);
};

export const normalizeRole = (role: unknown): FmzAccessControlRole => {
  const record = recordOf(role);
  const roleKey = normalized(str(record.role_key, str(record.roleKey, str(record.name, str(record.key, str(record.id))))));
  const id = str(record.id, roleKey);
  return {
    id,
    name: roleKey || id,
    description: str(record.description, str(record.desc)),
    color: str(record.color, '#0D1321'),
    permissionKeys: permissionKeys(record),
    isProtected: Boolean(record.isProtected ?? record.is_protected ?? record.protected ?? record.isSystem ?? record.is_system_role),
  };
};

export async function getAccessControlCatalog(): Promise<FmzAccessControlCatalog> {
  const { data } = await firmezaApiClient.get(`${BASE_PATH}/catalog`);
  return { pages: arr<unknown>(data, ['pages', 'systemPages']).map(normalizePage), permissions: arr<unknown>(data, ['permissions']).map(normalizePermission) };
}
export async function getAccessControlRoles(): Promise<FmzAccessControlRole[]> {
  const { data } = await firmezaApiClient.get(`${BASE_PATH}/roles`);
  return arr<unknown>(data, ['roles']).map(normalizeRole);
}
export async function getAccessControlRole(roleIdOrName: string): Promise<FmzAccessControlRole> {
  const { data } = await firmezaApiClient.get(`${BASE_PATH}/roles/${encodeURIComponent(roleIdOrName)}`);
  return normalizeRole(data?.role ?? data?.data ?? data);
}
export async function createAccessControlRole(payload: FmzRolePayload): Promise<FmzAccessControlRole> {
  const { data } = await firmezaApiClient.post(`${BASE_PATH}/roles`, payload);
  return normalizeRole(data?.role ?? data?.data ?? data);
}
export async function updateAccessControlRole(roleIdOrName: string, payload: FmzRolePayload): Promise<FmzAccessControlRole> {
  const { data } = await firmezaApiClient.patch(`${BASE_PATH}/roles/${encodeURIComponent(roleIdOrName)}`, payload);
  return normalizeRole(data?.role ?? data?.data ?? data);
}
export async function deleteAccessControlRole(roleIdOrName: string): Promise<void> {
  await firmezaApiClient.delete(`${BASE_PATH}/roles/${encodeURIComponent(roleIdOrName)}`);
}
