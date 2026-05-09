export type FmzAdminPropertyStatus = 'disponivel' | 'alugado' | 'vendido' | 'inativo';
export type FmzAdminPropertyType = 'apartment' | 'house' | 'commercial' | 'land';

export type FmzAdminPropertyMetadata = {
  source?: string | null;
  legacyPropertyType?: string | null;
  legacyMarketStatus?: string | null;
  [key: string]: unknown;
};

export type FmzAdminProperty = {
  id: string;
  propertyCode?: string | null;
  name: string;
  description?: string | null;
  propertyType: FmzAdminPropertyType;
  addressLine1?: string | null;
  addressNumber?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  registryNumber?: string | null;
  appraisedValue: number;
  currency: string;
  status: FmzAdminPropertyStatus;
  backendStatus?: string | null;
  marketStatus?: string | null;
  totalAreaM2?: number | null;
  privateAreaM2?: number | null;
  bedroomsCount?: number | null;
  bathroomsCount?: number | null;
  parkingSpacesCount?: number | null;
  monthlyRentAmount?: number | null;
  annualPropertyTaxAmount?: number | null;
  monthlyCondoFeeAmount?: number | null;
  financialNotes?: string | null;
  metadata: FmzAdminPropertyMetadata;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminPropertyDraft = {
  id?: string;
  propertyCode: string;
  name: string;
  description: string;
  propertyType: FmzAdminPropertyType;
  status: FmzAdminPropertyStatus;
  totalAreaM2: string;
  privateAreaM2: string;
  bedroomsCount: string;
  bathroomsCount: string;
  parkingSpacesCount: string;
  postalCode: string;
  state: string;
  addressLine1: string;
  addressNumber: string;
  addressLine2: string;
  district: string;
  city: string;
  appraisedValue: string;
  monthlyRentAmount: string;
  annualPropertyTaxAmount: string;
  monthlyCondoFeeAmount: string;
  financialNotes: string;
  currency: string;
  country: string;
};

export type FmzCepAddress = {
  postalCode: string;
  addressLine1: string;
  district: string;
  city: string;
  state: string;
};
