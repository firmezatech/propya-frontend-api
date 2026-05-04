import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { FmzAccessControlCatalog, FmzAccessControlPage, FmzAccessControlPermission, FmzAccessControlRole, FmzRolePayload } from '../domain';

const BASE_PATH = '/admin/access-control';
const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value : fallback);
const arr = <T>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const record = recordOf(payload);
  for (const key of keys) if (Array.isArray(record[key])) return record[key] as T[];
  return record.data ? arr<T>(record.data, keys) : [];
};
const pageKeys = (pages: unknown): string[] => !Array.isArray(pages) ? [] : pages.map((page) => {
  if (typeof page === 'string' || typeof page === 'number') return String(page);
  const record = recordOf(page);
  return str(record.key, str(record.id, str(record.path)));
}).filter(Boolean);
const normalizePage = (page: unknown): FmzAccessControlPage => {
  const record = recordOf(page);
  const key = str(record.key, str(record.id, str(record.path)));
  const label = str(record.label, str(record.name, key));
  return { id: str(record.id, key), key, name: str(record.name, label), label, path: str(record.path, '#') };
};
const normalizePermission = (permission: unknown): FmzAccessControlPermission => {
  const record = recordOf(permission);
  const key = str(record.key, str(record.id));
  return { id: str(record.id, key), key, label: str(record.label, str(record.name, key)), pageKeys: pageKeys(record.pages ?? record.pageKeys ?? record.pageIds) };
};
const permissionKeys = (role: Record<string, unknown>): string[] => {
  const raw = role.permissionKeys ?? role.permissions ?? role.permKeys ?? role.permIds;
  return !Array.isArray(raw) ? [] : raw.map((permission) => {
    if (typeof permission === 'string' || typeof permission === 'number') return String(permission);
    const record = recordOf(permission);
    return str(record.key, str(record.id));
  }).filter(Boolean);
};
export const normalizeRole = (role: unknown): FmzAccessControlRole => {
  const record = recordOf(role);
  const id = str(record.id, str(record.key, str(record.name)));
  return { id, name: str(record.name, id), description: str(record.description, str(record.desc)), color: str(record.color, '#0D1321'), permissionKeys: permissionKeys(record), isProtected: Boolean(record.isProtected ?? record.protected ?? record.isSystem) };
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
