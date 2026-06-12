import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { FmzPlatformParam } from '../domain';

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const arr = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const optionalStr = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const valueTypeOf = (value: unknown): 'text' | 'numeric' | 'percent' => {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'numeric') return 'numeric';
  if (v === 'percent') return 'percent';
  return 'text';
};

const normalizePlatformParam = (raw: unknown): FmzPlatformParam => {
  const r = recordOf(raw);
  const numericRaw = r.numeric_value ?? r.numericValue;
  return {
    parameterKey: String(r.parameter_key ?? r.parameterKey ?? ''),
    label: String(r.label ?? ''),
    description: optionalStr(r.description),
    valueType: valueTypeOf(r.value_type ?? r.valueType),
    textValue: optionalStr(r.text_value ?? r.textValue),
    numericValue: numericRaw != null && numericRaw !== '' ? Number(numericRaw) : null,
    isActive: typeof r.is_active === 'boolean' ? r.is_active : true,
  };
};

export async function listPlatformParams(): Promise<FmzPlatformParam[]> {
  const { data } = await firmezaApiClient.get('/admin/platform-params');
  const r = recordOf(data);
  return arr(r.params ?? r.data).map(normalizePlatformParam);
}

export async function updatePlatformParam(key: string, value: string): Promise<FmzPlatformParam> {
  const { data } = await firmezaApiClient.patch(
    `/admin/platform-params/${encodeURIComponent(key)}`,
    { value },
  );
  const r = recordOf(data);
  return normalizePlatformParam(r.param ?? r.data ?? data);
}
