import type {
  FmzTenantProfile,
  FmzTenantProperty,
  FmzTenantContract,
  FmzTenantOwnership,
  FmzTenantNextGoal,
  FmzTenantRentInsight,
  FmzTenantDocument,
  FmzTenantMissingField,
} from './fmz-tenant-portal.types';

export type FmzTenantContractPageData = {
  tenant?: FmzTenantProfile | null;
  property?: FmzTenantProperty | null;
  contract?: FmzTenantContract | null;
  ownership?: FmzTenantOwnership | null;
  nextGoal?: FmzTenantNextGoal | null;
  rentInsight?: FmzTenantRentInsight | null;
  documents?: FmzTenantDocument[];
};

export type FmzTenantContractApiPayload = {
  success?: boolean;
  hasData?: boolean;
  contractPage?: FmzTenantContractPageData | null;
  missingFields?: FmzTenantMissingField[];
};
