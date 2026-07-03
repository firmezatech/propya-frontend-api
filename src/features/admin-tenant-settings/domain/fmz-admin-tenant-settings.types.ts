export type FmzTenantSettingsValueType = 'percentage' | 'currency';
export type FmzTenantSettingsScope = 'global' | 'property' | 'contract';

export type FmzAdminFeeParameter = {
  id: string;
  parameterKey: string;
  parameterValue: number;
  valueType: FmzTenantSettingsValueType;
  parameterScope: FmzTenantSettingsScope;
  propertyId?: string | null;
  rentalContractId?: string | null;
  description?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminFeeParameterDraft = {
  parameterKey: string;
  parameterValue: number;
  valueType: FmzTenantSettingsValueType;
  parameterScope: FmzTenantSettingsScope;
  propertyId?: string | null;
  rentalContractId?: string | null;
  description?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
};

export type FmzAdminOwnershipGoal = {
  id: string;
  propertyTokenizationId?: string | null;
  goalKey: string;
  title: string;
  description?: string | null;
  rentReductionAmount?: number | null;
  targetPercentage?: number | null;
  targetTokenAmount?: number | null;
  rewardDescription?: string | null;
  displayOrder?: number | null;
  isActive: boolean;
  achievementRate?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FmzAdminOwnershipGoalDraft = {
  tenantUserId: string;
  propertyId: string;
  rentalContractId?: string | null;
  propertyTokenizationId: string;
  goalKey: string;
  title: string;
  description?: string | null;
  targetPercentage?: number | null;
  targetTokenAmount?: number | null;
  rewardDescription?: string | null;
  displayOrder?: number | null;
  isActive: boolean;
};

export type FmzAdminEligibleTenant = {
  tenantUserId: string;
  tenantName: string;
  tenantEmail: string;
  propertyId: string;
  propertyName: string;
  propertyCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  rentalContractId: string;
  propertyTokenizationId: string;
  tokenSymbol: string | null;
  totalSupply: number;
  tokenUnitValue: number | null;
  currentOwnershipPercentage: number;
  coOwnersCount: number;
  baseMonthlyRent: number;
  condominiumFeeAmount: number;
  platformFeePercent: number;
  tokenFeePercent: number;
  monthlyTokenAmount: number;
  contractStatus: string;
  propertyStatus: string;
};

export type FmzAdminTenantSettings = {
  parameters: FmzAdminFeeParameter[];
  goals: FmzAdminOwnershipGoal[];
  // Resolved by the backend from propertyId (B3) — reused by the "Por imóvel" tab to create goals.
  propertyTokenizationId?: string | null;
};

export type FmzAdminGoalAchievement = {
  id: string;
  goalId: string;
  tenantUserId: string;
  tenantName: string | null;
  tenantEmail: string | null;
  propertyTokenizationId: string;
  tokenBalanceAtAchievement: number;
  ownershipBpsAtAchievement: number;
  achievedAt: string;
};

export type FmzPlatformParam = {
  parameterKey: string;
  label: string;
  description: string | null;
  valueType: 'text' | 'numeric' | 'percent';
  textValue: string | null;
  numericValue: number | null;
  isActive: boolean;
};
