import type { FmzAccessControlPage, FmzAccessControlRole } from '../../access-control/domain';

export type FmzAdminUserStatus = 'active' | 'inactive';

export type FmzAdminReadOnlyFields = {
  wallets: boolean;
  coOwnerOwnershipPercentage: boolean;
  tenantOwnershipPercentage: boolean;
};

export type FmzAdminUserWallet = {
  id: string;
  userId: string;
  walletAddress: string;
  publicKey?: string | null;
  chainId: number;
  walletType: string;
  custodyType: string;
  verificationStatus: string;
  status: string;
  assignedAt?: string | null;
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminUserTokenProfile = {
  userId: string;
  investorProfile?: string | null;
  kycStatus: string;
  isTokenEnabled: boolean;
  riskScore?: number | null;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminProperty = {
  id: string;
  propertyCode?: string | null;
  name: string;
  description?: string | null;
  propertyType?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  registryNumber?: string | null;
  appraisedValue?: string | number | null;
  currency?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminPropertyTokenization = {
  id: string;
  propertyId: string;
  blockchainContractId?: string | null;
  tokenId?: string | number | null;
  tokenSymbol?: string | null;
  tokenName?: string | null;
  totalSupply?: string | number | null;
  distributedSupply?: string | number | null;
  tokenUnitValue?: string | number | null;
  currency?: string | null;
  status?: string | null;
  mintedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type FmzAdminTenantContract = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  contractNumber?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  paymentDay?: number | null;
  baseMonthlyRent?: string | number | null;
  originalBaseRent?: string | number | null;
  rentAdjustmentIndex?: string | null;
  lastAdjustedAt?: string | null;
  nextAdjustmentDate?: string | null;
  currency?: string | null;
  status?: string | null;
  contractFileUrl?: string | null;
  importantTerms: Record<string, unknown>;
  signedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  property?: FmzAdminProperty | null;
};

export type FmzAdminCoOwnerProperty = {
  id: string;
  userId: string;
  propertyId: string;
  propertyTokenizationId: string;
  tokenBalance: string | number;
  pendingTokenBalance: string | number;
  ownershipBps: number;
  ownershipPercentage: number;
  lastTokenTransactionId?: string | null;
  updatedAt?: string;
  property?: FmzAdminProperty | null;
  tokenization?: FmzAdminPropertyTokenization | null;
};

export type FmzAdminPropertyRelation = {
  id: string;
  propertyId: string;
  userId: string;
  relationType: string;
  isActive: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  property?: FmzAdminProperty | null;
};

export type FmzAdminUser = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  phoneCountry?: string | null;
  phoneDialCode?: string | null;
  phoneNationalNumber?: string | null;
  phoneE164?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  birthdate?: string | null;
  role?: string;
  roles: string[];
  roleKeys: string[];
  permissionKeys: string[];
  permissions: string[];
  accessiblePages: FmzAccessControlPage[];
  isActive: boolean;
  status: FmzAdminUserStatus;
  isAdmin: boolean;
  profile?: number | string | null;
  wallets: FmzAdminUserWallet[];
  wallet?: string | null;
  walletAddress?: string | null;
  tokenProfile?: FmzAdminUserTokenProfile | null;
  tenantContracts: FmzAdminTenantContract[];
  contracts: FmzAdminTenantContract[];
  coOwnerProperties: FmzAdminCoOwnerProperty[];
  propertyOwnerships: FmzAdminCoOwnerProperty[];
  propertyRelations: FmzAdminPropertyRelation[];
  readOnlyFields: FmzAdminReadOnlyFields;
  failedLoginAttempts?: number;
  lastFailedLoginAt?: string | null;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminUserDraft = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  phoneCountry?: string | null;
  status: FmzAdminUserStatus;
  roleKeys: string[];
  password?: string;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  birthdate?: string | null;
};

export type FmzAdminUserRole = FmzAccessControlRole;
