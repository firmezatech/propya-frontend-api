import { firmezaApiClient } from '../../../services/firmeza-api-client';

export type FmzPlatformInfo = {
  brand_name: string | null;
  company_legal_name: string | null;
  company_cnpj: string | null;
  company_address: string | null;
  support_email: string | null;
  support_whatsapp_url: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_facebook: string | null;
  social_x: string | null;
};

const FALLBACK_PLATFORM_INFO: FmzPlatformInfo = {
  brand_name: null,
  company_legal_name: null,
  company_cnpj: null,
  company_address: null,
  support_email: null,
  support_whatsapp_url: null,
  social_instagram: null,
  social_tiktok: null,
  social_linkedin: null,
  social_youtube: null,
  social_facebook: null,
  social_x: null,
};

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const optionalStr = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizePlatformInfo = (raw: unknown): FmzPlatformInfo => {
  const r = recordOf(raw);
  return {
    brand_name:           optionalStr(r.brand_name),
    company_legal_name:   optionalStr(r.company_legal_name),
    company_cnpj:         optionalStr(r.company_cnpj),
    company_address:      optionalStr(r.company_address),
    support_email:        optionalStr(r.support_email),
    support_whatsapp_url: optionalStr(r.support_whatsapp_url),
    social_instagram:     optionalStr(r.social_instagram),
    social_tiktok:        optionalStr(r.social_tiktok),
    social_linkedin:      optionalStr(r.social_linkedin),
    social_youtube:       optionalStr(r.social_youtube),
    social_facebook:      optionalStr(r.social_facebook),
    social_x:             optionalStr(r.social_x),
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
