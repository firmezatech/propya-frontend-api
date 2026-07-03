import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type {
  FmzAdminEligibleTenant,
  FmzAdminFeeParameter,
  FmzAdminFeeParameterDraft,
  FmzAdminGoalAchievement,
  FmzAdminOwnershipGoal,
  FmzAdminOwnershipGoalDraft,
  FmzAdminTenantSettings,
  FmzTenantSettingsScope,
  FmzTenantSettingsValueType,
} from '../domain';

const TENANT_SETTINGS_PATH =
  process.env.NEXT_PUBLIC_FMZ_ADMIN_TENANT_SETTINGS_PATH || '/admin/tenant-settings';

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const optionalStr = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
};

const optionalNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = num(value, NaN);
  return Number.isNaN(parsed) ? null : parsed;
};

const bool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes', 'active'].includes(value.trim().toLowerCase());
  if (typeof value === 'number') return value === 1;
  return fallback;
};

const arr = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const scopeOf = (value: unknown): FmzTenantSettingsScope => {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'property') return 'property';
  if (v === 'contract') return 'contract';
  return 'global';
};

const valueTypeOf = (value: unknown): FmzTenantSettingsValueType => {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'currency' || v === 'fixed' || v === 'fixo') return 'currency';
  return 'percentage';
};

export const normalizeFeeParameter = (raw: unknown): FmzAdminFeeParameter => {
  const r = recordOf(raw);
  return {
    id: str(r.id ?? r.parameterId ?? r.parameter_id, str(r.parameterKey ?? r.parameter_key)),
    parameterKey: str(r.parameterKey ?? r.parameter_key),
    parameterValue: num(r.parameterValue ?? r.parameter_value),
    valueType: valueTypeOf(r.valueType ?? r.value_type),
    parameterScope: scopeOf(r.parameterScope ?? r.parameter_scope),
    propertyId: optionalStr(r.propertyId ?? r.property_id),
    rentalContractId: optionalStr(r.rentalContractId ?? r.rental_contract_id),
    description: optionalStr(r.description),
    validFrom: optionalStr(r.validFrom ?? r.valid_from),
    validTo: optionalStr(r.validTo ?? r.valid_to),
    isActive: bool(r.isActive ?? r.is_active, true),
    createdAt: optionalStr(r.createdAt ?? r.created_at) ?? undefined,
    updatedAt: optionalStr(r.updatedAt ?? r.updated_at) ?? undefined,
  };
};

export const normalizeOwnershipGoal = (raw: unknown): FmzAdminOwnershipGoal => {
  const r = recordOf(raw);
  const rawDescription = optionalStr(r.description);
  const parsedReduction = rawDescription != null ? optionalNum(rawDescription) : null;
  return {
    id: str(r.id ?? r.goalId ?? r.goal_id, str(r.goalKey ?? r.goal_key)),
    propertyTokenizationId: optionalStr(r.propertyTokenizationId ?? r.property_tokenization_id),
    goalKey: str(r.goalKey ?? r.goal_key),
    title: str(r.title, str(r.name)),
    description: rawDescription,
    rentReductionAmount: parsedReduction,
    targetPercentage: optionalNum(r.targetPercentage ?? r.target_percentage),
    targetTokenAmount: optionalNum(r.targetTokenAmount ?? r.target_token_amount),
    rewardDescription: optionalStr(r.rewardDescription ?? r.reward_description),
    displayOrder: optionalNum(r.displayOrder ?? r.display_order),
    isActive: bool(r.isActive ?? r.is_active, true),
    achievementRate: optionalNum(r.achievementRate ?? r.achievement_rate ?? r.progress),
    createdAt: optionalStr(r.createdAt ?? r.created_at) ?? undefined,
    updatedAt: optionalStr(r.updatedAt ?? r.updated_at) ?? undefined,
  };
};

const normalizeTenantSettings = (data: unknown): FmzAdminTenantSettings => {
  const r = recordOf(data);
  const nested = recordOf(r.data ?? r.settings);
  const parameters = arr(nested.parameters ?? r.parameters);
  const goals = arr(nested.goals ?? r.goals);
  return {
    parameters: parameters.map(normalizeFeeParameter),
    goals: goals.map(normalizeOwnershipGoal),
    propertyTokenizationId: optionalStr(
      nested.propertyTokenizationId ?? r.propertyTokenizationId ?? r.property_tokenization_id,
    ),
  };
};

export const normalizeEligibleTenant = (raw: unknown): FmzAdminEligibleTenant => {
  const r = recordOf(raw);
  return {
    tenantUserId: str(r.tenantUserId ?? r.tenant_user_id),
    tenantName: str(r.tenantName ?? r.tenant_name),
    tenantEmail: str(r.tenantEmail ?? r.tenant_email),
    propertyId: str(r.propertyId ?? r.property_id),
    propertyName: str(r.propertyName ?? r.property_name),
    propertyCode: optionalStr(r.propertyCode ?? r.property_code),
    addressLine1: optionalStr(r.addressLine1 ?? r.address_line_1),
    addressLine2: optionalStr(r.addressLine2 ?? r.address_line_2),
    district: optionalStr(r.district),
    city: optionalStr(r.city),
    state: optionalStr(r.state),
    rentalContractId: str(r.rentalContractId ?? r.rental_contract_id),
    propertyTokenizationId: str(r.propertyTokenizationId ?? r.property_tokenization_id),
    tokenSymbol: optionalStr(r.tokenSymbol ?? r.token_symbol),
    totalSupply: num(r.totalSupply ?? r.total_supply),
    tokenUnitValue: optionalNum(r.tokenUnitValue ?? r.token_unit_value),
    currentOwnershipPercentage: num(r.currentOwnershipPercentage ?? r.current_ownership_percentage),
    coOwnersCount: num(r.coOwnersCount ?? r.co_owners_count),
    baseMonthlyRent: num(r.baseMonthlyRent ?? r.base_monthly_rent),
    condominiumFeeAmount: num(r.condominiumFeeAmount ?? r.condominium_fee_amount),
    platformFeePercent: num(r.platformFeePercent ?? r.platform_fee_percent),
    tokenFeePercent: num(r.tokenFeePercent ?? r.token_fee_percent),
    monthlyTokenAmount: num(r.monthlyTokenAmount ?? r.monthly_token_amount),
    contractStatus: str(r.contractStatus ?? r.contract_status, 'active'),
    propertyStatus: str(r.propertyStatus ?? r.property_status, 'active'),
  };
};

export async function listEligibleTenants(): Promise<FmzAdminEligibleTenant[]> {
  const { data } = await firmezaApiClient.get(`${TENANT_SETTINGS_PATH}/tenants`);
  const r = recordOf(data);
  return arr(r.items ?? r.data).map(normalizeEligibleTenant);
}

// Passing propertyId scopes parameters+goals to one property; the backend (B3) resolves the
// property_tokenization_id and echoes it back so the caller can create goals for that property.
export async function getAdminTenantSettings(
  params: { propertyId?: string } = {},
): Promise<FmzAdminTenantSettings> {
  const query = params.propertyId
    ? `?${new URLSearchParams({ propertyId: params.propertyId }).toString()}`
    : '';
  const { data } = await firmezaApiClient.get(`${TENANT_SETTINGS_PATH}${query}`);
  return normalizeTenantSettings(data);
}

export async function createFeeParameter(
  draft: FmzAdminFeeParameterDraft,
): Promise<FmzAdminFeeParameter> {
  const { data } = await firmezaApiClient.post(`${TENANT_SETTINGS_PATH}/parameters`, draft);
  const r = recordOf(data);
  return normalizeFeeParameter(r.parameter ?? r.data ?? data);
}

export async function updateFeeParameter(
  parameterId: string,
  draft: Partial<FmzAdminFeeParameterDraft>,
): Promise<FmzAdminFeeParameter> {
  const { data } = await firmezaApiClient.patch(
    `${TENANT_SETTINGS_PATH}/parameters/${encodeURIComponent(parameterId)}`,
    draft,
  );
  const r = recordOf(data);
  return normalizeFeeParameter(r.parameter ?? r.data ?? data);
}

export async function createOwnershipGoal(
  draft: FmzAdminOwnershipGoalDraft,
): Promise<FmzAdminOwnershipGoal> {
  const { data } = await firmezaApiClient.post(`${TENANT_SETTINGS_PATH}/goals`, draft);
  const r = recordOf(data);
  return normalizeOwnershipGoal(r.goal ?? r.data ?? data);
}

export async function updateOwnershipGoal(
  goalId: string,
  draft: Partial<FmzAdminOwnershipGoalDraft>,
): Promise<FmzAdminOwnershipGoal> {
  const { data } = await firmezaApiClient.patch(
    `${TENANT_SETTINGS_PATH}/goals/${encodeURIComponent(goalId)}`,
    draft,
  );
  const r = recordOf(data);
  return normalizeOwnershipGoal(r.goal ?? r.data ?? data);
}

export async function deleteOwnershipGoal(goalId: string): Promise<void> {
  await firmezaApiClient.delete(`${TENANT_SETTINGS_PATH}/goals/${encodeURIComponent(goalId)}`);
}

export const normalizeGoalAchievement = (raw: unknown): FmzAdminGoalAchievement => {
  const r = recordOf(raw);
  return {
    id: str(r.id),
    goalId: str(r.goalId ?? r.goal_id),
    tenantUserId: str(r.tenantUserId ?? r.tenant_user_id),
    tenantName: optionalStr(r.tenantName ?? r.tenant_name),
    tenantEmail: optionalStr(r.tenantEmail ?? r.tenant_email),
    propertyTokenizationId: str(r.propertyTokenizationId ?? r.property_tokenization_id),
    tokenBalanceAtAchievement: num(r.tokenBalanceAtAchievement ?? r.token_balance_at_achievement),
    ownershipBpsAtAchievement: num(r.ownershipBpsAtAchievement ?? r.ownership_bps_at_achievement),
    achievedAt: str(r.achievedAt ?? r.achieved_at),
  };
};

export async function listGoalAchievements(
  propertyTokenizationId: string,
  goalId?: string,
): Promise<FmzAdminGoalAchievement[]> {
  const params = new URLSearchParams({ propertyTokenizationId });
  if (goalId) params.set('goalId', goalId);
  const { data } = await firmezaApiClient.get(
    `${TENANT_SETTINGS_PATH}/goals/achievements?${params.toString()}`,
  );
  const r = recordOf(data);
  return arr(r.achievements ?? r.data).map(normalizeGoalAchievement);
}
