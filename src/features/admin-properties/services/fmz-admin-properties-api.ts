import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { buildAdminPaginationParams, normalizeAdminPaginatedPayload, type FmzAdminPaginationRequest, type FmzPaginatedAdminResult } from '../../admin-pagination';
import type { FmzAdminProperty, FmzAdminPropertyDraft, FmzAdminPropertyMetadata, FmzAdminPropertyStatus, FmzAdminPropertyType, FmzCepAddress } from '../domain';

const ADMIN_PROPERTIES_PATH = process.env.NEXT_PUBLIC_FMZ_ADMIN_PROPERTIES_PATH || '/admin/properties';
const CEP_LOOKUP_URL_TEMPLATE = process.env.NEXT_PUBLIC_FMZ_CEP_LOOKUP_URL_TEMPLATE || 'https://viacep.com.br/ws/{cep}/json/';

const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const arr = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const optionalStr = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
const normalized = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const normalizedNumber = value.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalizedNumber);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const arrFromPayload = <T = unknown>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const record = recordOf(payload);
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  return record.data ? arrFromPayload<T>(record.data, keys) : [];
};

const propertyTypeOf = (value: unknown): FmzAdminPropertyType => {
  const key = normalized(value);
  if (key === 'house' || key === 'casa') return 'house';
  if (key === 'commercial' || key === 'comercial') return 'commercial';
  if (key === 'land' || key === 'terreno') return 'land';
  return 'apartment';
};

const uiStatusFromRecord = (record: Record<string, unknown>): FmzAdminPropertyStatus => {
  const marketStatus = normalized(record.marketStatus ?? record.market_status);
  const status = normalized(record.status);
  if (marketStatus === 'rented' || marketStatus === 'alugado') return 'alugado';
  if (marketStatus === 'sold' || status === 'sold' || status === 'vendido') return 'vendido';
  if (marketStatus === 'inactive' || status === 'inactive' || status === 'archived' || status === 'inativo') return 'inativo';
  return 'disponivel';
};

const metadataOf = (value: unknown): FmzAdminPropertyMetadata => recordOf(value) as FmzAdminPropertyMetadata;

export const normalizeAdminProperty = (property: unknown): FmzAdminProperty => {
  const record = recordOf(property);
  const metadata = metadataOf(record.metadata);
  const id = str(record.id, str(record.propertyId, str(record.property_id, str(record.propertyCode, str(record.property_code)))));
  return {
    id,
    propertyCode: optionalStr(record.propertyCode ?? record.property_code),
    name: str(record.name, 'Imóvel sem nome'),
    description: optionalStr(record.description),
    propertyType: propertyTypeOf(record.propertyType ?? record.property_type),
    addressLine1: optionalStr(record.addressLine1 ?? record.address_line_1),
    addressNumber: optionalStr(record.addressNumber ?? record.address_number),
    addressLine2: optionalStr(record.addressLine2 ?? record.address_line_2),
    district: optionalStr(record.district),
    city: optionalStr(record.city),
    state: optionalStr(record.state),
    postalCode: optionalStr(record.postalCode ?? record.postal_code),
    country: optionalStr(record.country) ?? 'BR',
    registryNumber: optionalStr(record.registryNumber ?? record.registry_number),
    appraisedValue: num(record.appraisedValue ?? record.appraised_value, 0),
    currency: str(record.currency, 'BRL'),
    status: uiStatusFromRecord(record),
    backendStatus: optionalStr(record.status),
    marketStatus: optionalStr(record.marketStatus ?? record.market_status),
    totalAreaM2: num(record.totalAreaM2 ?? record.total_area_m2, 0) || null,
    privateAreaM2: num(record.privateAreaM2 ?? record.private_area_m2, 0) || null,
    bedroomsCount: num(record.bedroomsCount ?? record.bedrooms_count, 0) || null,
    bathroomsCount: num(record.bathroomsCount ?? record.bathrooms_count, 0) || null,
    parkingSpacesCount: num(record.parkingSpacesCount ?? record.parking_spaces_count, 0) || null,
    monthlyRentAmount: num(record.monthlyRentAmount ?? record.monthly_rent_amount, 0) || null,
    annualPropertyTaxAmount: num(record.annualPropertyTaxAmount ?? record.annual_property_tax_amount, 0) || null,
    monthlyCondoFeeAmount: num(record.monthlyCondoFeeAmount ?? record.monthly_condo_fee_amount, 0) || null,
    financialNotes: optionalStr(record.financialNotes ?? record.financial_notes),
    metadata,
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
  };
};

const backendStatusFromUi = (status: FmzAdminPropertyStatus): 'active' | 'inactive' | 'sold' => {
  if (status === 'vendido') return 'sold';
  if (status === 'inativo') return 'inactive';
  return 'active';
};

const marketStatusFromUi = (status: FmzAdminPropertyStatus): 'available' | 'rented' | 'sold' | 'inactive' => {
  if (status === 'alugado') return 'rented';
  if (status === 'vendido') return 'sold';
  if (status === 'inativo') return 'inactive';
  return 'available';
};

const toNullableNumber = (value: string): number | null => {
  const parsed = num(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildPropertyCode = (draft: FmzAdminPropertyDraft): string => {
  if (draft.propertyCode.trim()) return draft.propertyCode.trim().toLowerCase();
  const source = [draft.name, draft.city, draft.state].filter(Boolean).join('-') || `property-${Date.now()}`;
  const slug = source.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
  return slug || `property-${Date.now()}`;
};

const payloadFromDraft = (draft: FmzAdminPropertyDraft) => ({
  propertyCode: buildPropertyCode(draft),
  name: draft.name.trim(),
  description: draft.description.trim(),
  propertyType: draft.propertyType,
  addressLine1: draft.addressLine1.trim(),
  addressNumber: draft.addressNumber.trim(),
  addressLine2: draft.addressLine2.trim(),
  district: draft.district.trim(),
  city: draft.city.trim(),
  state: draft.state.trim().toUpperCase(),
  postalCode: draft.postalCode.trim(),
  country: draft.country.trim() || 'BR',
  appraisedValue: toNullableNumber(draft.appraisedValue) ?? 0,
  currency: draft.currency.trim() || 'BRL',
  status: backendStatusFromUi(draft.status),
  marketStatus: marketStatusFromUi(draft.status),
  totalAreaM2: toNullableNumber(draft.totalAreaM2),
  privateAreaM2: toNullableNumber(draft.privateAreaM2),
  bedroomsCount: toNullableNumber(draft.bedroomsCount),
  bathroomsCount: toNullableNumber(draft.bathroomsCount),
  parkingSpacesCount: toNullableNumber(draft.parkingSpacesCount),
  monthlyRentAmount: toNullableNumber(draft.monthlyRentAmount),
  annualPropertyTaxAmount: toNullableNumber(draft.annualPropertyTaxAmount),
  monthlyCondoFeeAmount: toNullableNumber(draft.monthlyCondoFeeAmount),
  financialNotes: draft.financialNotes.trim() || null,
  metadata: {
    source: 'admin_property_form',
  },
});

export async function getAdminProperties(request: FmzAdminPaginationRequest = {}): Promise<FmzPaginatedAdminResult<FmzAdminProperty>> {
  const { data } = await firmezaApiClient.get(ADMIN_PROPERTIES_PATH, {
    params: buildAdminPaginationParams(request),
  });

  const result = normalizeAdminPaginatedPayload(
    data,
    ['properties'],
    normalizeAdminProperty,
    request,
  );

  return {
    ...result,
    items: result.items.filter((property) => Boolean(property.id || property.name)),
  };
}

export async function getAdminProperty(propertyId: string): Promise<FmzAdminProperty> {
  const { data } = await firmezaApiClient.get(`${ADMIN_PROPERTIES_PATH}/${encodeURIComponent(propertyId)}`);
  return normalizeAdminProperty(recordOf(data).property ?? recordOf(data).data ?? data);
}

export async function createAdminProperty(draft: FmzAdminPropertyDraft): Promise<FmzAdminProperty> {
  const { data } = await firmezaApiClient.post(ADMIN_PROPERTIES_PATH, payloadFromDraft(draft));
  return normalizeAdminProperty(recordOf(data).property ?? recordOf(data).data ?? data);
}

export async function updateAdminProperty(draft: FmzAdminPropertyDraft): Promise<FmzAdminProperty> {
  if (!draft.id) throw new Error('Property id is required to update an admin property.');
  const { data } = await firmezaApiClient.patch(`${ADMIN_PROPERTIES_PATH}/${encodeURIComponent(draft.id)}`, payloadFromDraft(draft));
  return normalizeAdminProperty(recordOf(data).property ?? recordOf(data).data ?? data);
}

export async function deleteAdminProperty(propertyId: string): Promise<void> {
  await firmezaApiClient.delete(`${ADMIN_PROPERTIES_PATH}/${encodeURIComponent(propertyId)}`);
}

export async function lookupCepAddress(postalCode: string): Promise<FmzCepAddress | null> {
  const digits = postalCode.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const url = CEP_LOOKUP_URL_TEMPLATE.replace('{cep}', encodeURIComponent(digits));
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = recordOf(await response.json());
  if (data.erro) return null;
  return {
    postalCode,
    addressLine1: str(data.logradouro),
    district: str(data.bairro),
    city: str(data.localidade),
    state: str(data.uf),
  };
}

export function buildDraftFromProperty(property: FmzAdminProperty): FmzAdminPropertyDraft {
  return {
    id: property.id,
    propertyCode: property.propertyCode ?? '',
    name: property.name,
    description: property.description ?? '',
    propertyType: property.propertyType,
    status: property.status,
    totalAreaM2: property.totalAreaM2 ? String(property.totalAreaM2) : '',
    privateAreaM2: property.privateAreaM2 ? String(property.privateAreaM2) : '',
    bedroomsCount: property.bedroomsCount ? String(property.bedroomsCount) : '',
    bathroomsCount: property.bathroomsCount ? String(property.bathroomsCount) : '',
    parkingSpacesCount: property.parkingSpacesCount ? String(property.parkingSpacesCount) : '',
    postalCode: property.postalCode ?? '',
    state: property.state ?? 'SP',
    addressLine1: property.addressLine1 ?? '',
    addressNumber: property.addressNumber ?? '',
    addressLine2: property.addressLine2 ?? '',
    district: property.district ?? '',
    city: property.city ?? '',
    appraisedValue: property.appraisedValue ? String(property.appraisedValue) : '',
    monthlyRentAmount: property.monthlyRentAmount ? String(property.monthlyRentAmount) : '',
    annualPropertyTaxAmount: property.annualPropertyTaxAmount ? String(property.annualPropertyTaxAmount) : '',
    monthlyCondoFeeAmount: property.monthlyCondoFeeAmount ? String(property.monthlyCondoFeeAmount) : '',
    financialNotes: property.financialNotes ?? '',
    currency: property.currency || 'BRL',
    country: property.country || 'BR',
  };
}

export const emptyAdminPropertyDraft = (): FmzAdminPropertyDraft => ({
  propertyCode: '',
  name: '',
  description: '',
  propertyType: 'apartment',
  status: 'disponivel',
  totalAreaM2: '',
  privateAreaM2: '',
  bedroomsCount: '',
  bathroomsCount: '',
  parkingSpacesCount: '',
  postalCode: '',
  state: 'SP',
  addressLine1: '',
  addressNumber: '',
  addressLine2: '',
  district: '',
  city: '',
  appraisedValue: '',
  monthlyRentAmount: '',
  annualPropertyTaxAmount: '',
  monthlyCondoFeeAmount: '',
  financialNotes: '',
  currency: 'BRL',
  country: 'BR',
});
