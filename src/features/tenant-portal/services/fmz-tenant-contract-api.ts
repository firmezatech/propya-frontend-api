import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { FmzTenantContractApiPayload, FmzTenantContractPageData } from '../domain/fmz-tenant-contract.types';

export async function getTenantContract(propertyId?: string | number | null): Promise<FmzTenantContractApiPayload> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(String(propertyId))}` : '';
  const { data } = await firmezaApiClient.get(`/tenant/contract${query}`);
  return data as FmzTenantContractApiPayload;
}

export async function getCurrentTenantContract(propertyId?: string | number | null): Promise<FmzTenantContractPageData | null> {
  const payload = await getTenantContract(propertyId);
  return payload.hasData === false ? null : payload.contractPage ?? null;
}
