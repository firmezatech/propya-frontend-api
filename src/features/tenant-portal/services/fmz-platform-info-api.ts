import { firmezaApiClient } from '../../../services/firmeza-api-client';

export type FmzPlatformInfo = {
  brand_name: string | null;
  company_legal_name: string | null;
  company_cnpj: string | null;
  company_address: string | null;
  support_email: string | null;
};

const FALLBACK_PLATFORM_INFO: FmzPlatformInfo = {
  brand_name: null,
  company_legal_name: null,
  company_cnpj: null,
  company_address: null,
  support_email: null,
};

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const optionalStr = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizePlatformInfo = (raw: unknown): FmzPlatformInfo => {
  const r = recordOf(raw);
  return {
    brand_name:         optionalStr(r.brand_name),
    company_legal_name: optionalStr(r.company_legal_name),
    company_cnpj:       optionalStr(r.company_cnpj),
    company_address:    optionalStr(r.company_address),
    support_email:      optionalStr(r.support_email),
  };
};

export async function getPlatformInfo(): Promise<FmzPlatformInfo> {
  try {
    const { data } = await firmezaApiClient.get('/platform/info');
    const r = recordOf(data);
    return normalizePlatformInfo(r.info ?? r.data ?? data);
  } catch {
    return FALLBACK_PLATFORM_INFO;
  }
}
