import type { FmzAdminPaginationRequest, FmzPaginatedAdminResult } from '../domain/fmz-admin-pagination.types';

const DEFAULT_ADMIN_PAGE = 1;
const DEFAULT_ADMIN_LIMIT = 10;

const recordOf = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
);

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
};

const firstNumber = (fallback: number, ...values: unknown[]): number => {
  for (const value of values) {
    const parsed = toNumber(value, Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const arrayFromPayload = <T = unknown>(payload: unknown, itemKeys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  const record = recordOf(payload);

  for (const key of itemKeys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  const data = recordOf(record.data);
  for (const key of itemKeys) {
    if (Array.isArray(data[key])) return data[key] as T[];
  }

  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.results)) return record.results as T[];
  if (Array.isArray(record.rows)) return record.rows as T[];
  if (Array.isArray(data.items)) return data.items as T[];
  if (Array.isArray(data.results)) return data.results as T[];
  if (Array.isArray(data.rows)) return data.rows as T[];

  return [];
};

export const buildAdminPaginationParams = (request: FmzAdminPaginationRequest = {}): Record<string, string | number | boolean> => {
  const page = Math.max(1, Math.floor(request.page ?? DEFAULT_ADMIN_PAGE));
  const limit = Math.max(1, Math.floor(request.limit ?? DEFAULT_ADMIN_LIMIT));
  const params: Record<string, string | number | boolean> = { page, limit };

  const search = request.search?.trim();
  if (search) {
    params.search = search;
    params.query = search;
  }

  Object.entries(request.filters ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params[key] = value;
  });

  return params;
};

export function normalizeAdminPaginatedPayload<T>(
  payload: unknown,
  itemKeys: string[],
  normalizeItem: (item: unknown) => T,
  request: FmzAdminPaginationRequest = {},
): FmzPaginatedAdminResult<T> {
  const root = recordOf(payload);
  const data = recordOf(root.data);
  const meta = recordOf(root.pagination ?? root.meta ?? data.pagination ?? data.meta);
  const items = arrayFromPayload<unknown>(payload, itemKeys).map(normalizeItem);

  const page = Math.max(1, firstNumber(request.page ?? DEFAULT_ADMIN_PAGE, meta.page, root.page, data.page, meta.currentPage, root.currentPage, data.currentPage));
  const limit = Math.max(1, firstNumber(request.limit ?? DEFAULT_ADMIN_LIMIT, meta.limit, root.limit, data.limit, meta.pageSize, root.pageSize, data.pageSize, meta.perPage, root.perPage, data.perPage));
  const total = Math.max(0, firstNumber(items.length, meta.total, root.total, data.total, meta.totalItems, root.totalItems, data.totalItems, meta.count, root.count, data.count));
  const totalPages = Math.max(1, firstNumber(Math.max(1, Math.ceil(total / limit)), meta.totalPages, root.totalPages, data.totalPages, meta.pages, root.pages, data.pages));

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
