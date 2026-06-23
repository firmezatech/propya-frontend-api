import { firmezaApiClient } from '../../../services/firmeza-api-client';
import { buildAdminPaginationParams, normalizeAdminPaginatedPayload, type FmzAdminPaginationRequest, type FmzPaginatedAdminResult } from '../../admin-pagination';
import { normalizeRole } from '../../access-control/services/fmz-access-control-api';
import type { FmzAccessControlPage, FmzAccessControlRole } from '../../access-control/domain';
import type {
  FmzAdminCoOwnerProperty,
  FmzAdminProperty,
  FmzAdminPropertyRelation,
  FmzAdminPropertyTokenization,
  FmzAdminReadOnlyFields,
  FmzAdminTenantContract,
  FmzAdminUser,
  FmzAdminUserDraft,
  FmzAdminUserStatus,
  FmzAdminUserTokenProfile,
  FmzAdminUserWallet,
} from '../domain';

const ADMIN_USERS_PATH = process.env.NEXT_PUBLIC_FMZ_ADMIN_USERS_PATH || '/admin/users';
const ADMIN_ROLES_PATH = process.env.NEXT_PUBLIC_FMZ_ADMIN_ROLES_PATH || '/admin/access-control/roles';

const recordOf = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});
const str = (value: unknown, fallback = ''): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const optionalStr = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
const normalized = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
};

const normalizeBirthdateForApi = (value: string | null | undefined): string => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const brMatch = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return rawValue;

  const digits = rawValue.replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) return rawValue;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};
const bool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes', 'active'].includes(normalized(value));
  if (typeof value === 'number') return value === 1;
  return fallback;
};
const arr = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);
const arrFromPayload = <T = unknown>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const record = recordOf(payload);
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  return record.data ? arrFromPayload<T>(record.data, keys) : [];
};
const uniqueNormalizedArray = (...values: unknown[]): string[] => {
  const next = new Set<string>();
  values.forEach((value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const key = normalized(value);
      if (key) next.add(key);
      return;
    }
    if (!Array.isArray(value)) return;
    value.forEach((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        const key = normalized(item);
        if (key) next.add(key);
        return;
      }
      const itemRecord = recordOf(item);
      const key = normalized(itemRecord.role_key ?? itemRecord.roleKey ?? itemRecord.permission_key ?? itemRecord.permissionKey ?? itemRecord.key ?? itemRecord.name ?? itemRecord.id);
      if (key) next.add(key);
    });
  });
  return Array.from(next);
};

const statusOf = (value: unknown): FmzAdminUserStatus => {
  if (typeof value === 'boolean') return value ? 'active' : 'inactive';
  const current = normalized(value);
  return current === 'inactive' || current === 'disabled' || current === 'false' || current === 'blocked' ? 'inactive' : 'active';
};

const normalizeAccessiblePage = (page: unknown): FmzAccessControlPage | null => {
  const record = recordOf(page);
  const key = normalized(record.key ?? record.pageKey ?? record.page_key ?? record.id ?? record.path);
  const path = str(record.path);
  if (!key || !path) return null;
  return {
    id: str(record.id, key),
    key,
    name: str(record.name, str(record.label, key)),
    label: str(record.label, str(record.name, key)),
    path,
    order: num(record.order ?? record.orderIndex ?? record.order_index, 0),
    requiredPermission: normalized(record.requiredPermission ?? record.required_permission_key ?? record.requiredPermissionKey),
    showInDropdown: bool(record.showInDropdown ?? record.show_in_dropdown ?? record.isMenuVisible ?? record.is_menu_visible ?? record.includeInDropdown ?? record.include_in_dropdown, true),
  };
};

const normalizeAccessiblePages = (value: unknown): FmzAccessControlPage[] => {
  const pagesByKey = new Map<string, FmzAccessControlPage>();
  arr(value).forEach((page) => {
    const normalizedPage = normalizeAccessiblePage(page);
    if (normalizedPage) pagesByKey.set(normalizedPage.key, normalizedPage);
  });
  return Array.from(pagesByKey.values()).sort((left, right) => left.order - right.order);
};

const normalizeProperty = (property: unknown): FmzAdminProperty | null => {
  const record = recordOf(property);
  const id = str(record.id, str(record.propertyId, str(record.property_id)));
  if (!id && !str(record.name)) return null;
  return {
    id,
    propertyCode: optionalStr(record.propertyCode ?? record.property_code),
    name: str(record.name, 'Imóvel sem nome'),
    description: optionalStr(record.description),
    propertyType: optionalStr(record.propertyType ?? record.property_type),
    addressLine1: optionalStr(record.addressLine1 ?? record.address_line_1),
    addressLine2: optionalStr(record.addressLine2 ?? record.address_line_2),
    district: optionalStr(record.district),
    city: optionalStr(record.city),
    state: optionalStr(record.state),
    postalCode: optionalStr(record.postalCode ?? record.postal_code),
    country: optionalStr(record.country),
    registryNumber: optionalStr(record.registryNumber ?? record.registry_number),
    appraisedValue: (record.appraisedValue ?? record.appraised_value ?? null) as string | number | null,
    currency: optionalStr(record.currency),
    status: optionalStr(record.status),
    metadata: recordOf(record.metadata),
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
  };
};

const normalizeTokenization = (tokenization: unknown): FmzAdminPropertyTokenization | null => {
  const record = recordOf(tokenization);
  const id = str(record.id, str(record.propertyTokenizationId, str(record.property_tokenization_id)));
  if (!id && !str(record.tokenSymbol ?? record.token_symbol)) return null;
  return {
    id,
    propertyId: str(record.propertyId ?? record.property_id),
    blockchainContractId: optionalStr(record.blockchainContractId ?? record.blockchain_contract_id),
    tokenId: (record.tokenId ?? record.token_id ?? null) as string | number | null,
    tokenSymbol: optionalStr(record.tokenSymbol ?? record.token_symbol),
    tokenName: optionalStr(record.tokenName ?? record.token_name),
    totalSupply: (record.totalSupply ?? record.total_supply ?? null) as string | number | null,
    distributedSupply: (record.distributedSupply ?? record.distributed_supply ?? null) as string | number | null,
    tokenUnitValue: (record.tokenUnitValue ?? record.token_unit_value ?? null) as string | number | null,
    currency: optionalStr(record.currency),
    status: optionalStr(record.status),
    mintedAt: optionalStr(record.mintedAt ?? record.minted_at),
    metadata: recordOf(record.metadata),
  };
};

const normalizeWallet = (wallet: unknown, fallbackUserId = ''): FmzAdminUserWallet | null => {
  const record = recordOf(wallet);
  const walletAddress = normalized(record.walletAddress ?? record.wallet_address ?? record.address ?? record.publicKey ?? record.public_key);
  if (!walletAddress) return null;
  return {
    id: str(record.id, walletAddress),
    userId: str(record.userId ?? record.user_id, fallbackUserId),
    walletAddress,
    publicKey: optionalStr(record.publicKey ?? record.public_key),
    chainId: num(record.chainId ?? record.chain_id, 137),
    walletType: str(record.walletType ?? record.wallet_type, 'user'),
    custodyType: str(record.custodyType ?? record.custody_type, 'self_custody'),
    verificationStatus: str(record.verificationStatus ?? record.verification_status, 'unverified'),
    status: str(record.status, 'available'),
    assignedAt: optionalStr(record.assignedAt ?? record.assigned_at),
    verifiedAt: optionalStr(record.verifiedAt ?? record.verified_at),
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
  };
};

const normalizeOverdue = (overdue: unknown): FmzAdminTenantContract['overdue'] => {
  const record = recordOf(overdue);
  if (!Object.keys(record).length) return null;
  return {
    months: num(record.months),
    amount: num(record.amount),
    oldestMonth: optionalStr(record.oldestMonth ?? record.oldest_month),
  };
};

const normalizeTenantContract = (contract: unknown): FmzAdminTenantContract | null => {
  const record = recordOf(contract);
  const id = str(record.id);
  if (!id) return null;
  return {
    id,
    propertyId: str(record.propertyId ?? record.property_id),
    tenantUserId: str(record.tenantUserId ?? record.tenant_user_id),
    contractNumber: optionalStr(record.contractNumber ?? record.contract_number),
    startDate: optionalStr(record.startDate ?? record.start_date),
    endDate: optionalStr(record.endDate ?? record.end_date),
    paymentDay: record.paymentDay ?? record.payment_day ? num(record.paymentDay ?? record.payment_day) : null,
    baseMonthlyRent: (record.baseMonthlyRent ?? record.base_monthly_rent ?? null) as string | number | null,
    originalBaseRent: (record.originalBaseRent ?? record.original_base_rent ?? null) as string | number | null,
    rentAdjustmentIndex: optionalStr(record.rentAdjustmentIndex ?? record.rent_adjustment_index),
    lastAdjustedAt: optionalStr(record.lastAdjustedAt ?? record.last_adjusted_at),
    nextAdjustmentDate: optionalStr(record.nextAdjustmentDate ?? record.next_adjustment_date),
    currency: optionalStr(record.currency),
    status: optionalStr(record.status),
    contractFileUrl: optionalStr(record.contractFileUrl ?? record.contract_file_url),
    importantTerms: recordOf(record.importantTerms ?? record.important_terms),
    signedAt: optionalStr(record.signedAt ?? record.signed_at),
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
    property: normalizeProperty(record.property),
    overdue: normalizeOverdue(record.overdue),
  };
};

const normalizeOwnershipPercentage = (record: Record<string, unknown>): number => {
  const explicitPercentage = record.ownershipPercentage ?? record.ownership_percentage;
  if (explicitPercentage !== undefined && explicitPercentage !== null && String(explicitPercentage).trim() !== '') return num(explicitPercentage);
  const fraction = record.ownershipFraction ?? record.ownership_fraction;
  if (fraction !== undefined && fraction !== null && String(fraction).trim() !== '') return num(fraction) * 100;
  return num(record.ownershipBps ?? record.ownership_bps) / 100;
};

const normalizeCoOwnerProperty = (ownership: unknown): FmzAdminCoOwnerProperty | null => {
  const record = recordOf(ownership);
  const id = str(record.id, str(record.propertyTokenizationId ?? record.property_tokenization_id, str(record.propertyId ?? record.property_id)));
  const propertyId = str(record.propertyId ?? record.property_id ?? recordOf(record.property).id);
  if (!id && !propertyId) return null;
  return {
    id,
    userId: str(record.userId ?? record.user_id),
    propertyId,
    propertyTokenizationId: str(record.propertyTokenizationId ?? record.property_tokenization_id),
    tokenBalance: (record.tokenBalance ?? record.token_balance ?? record.balance ?? 0) as string | number,
    pendingTokenBalance: (record.pendingTokenBalance ?? record.pending_token_balance ?? record.pendingBalance ?? record.pending_balance ?? 0) as string | number,
    ownershipBps: num(record.ownershipBps ?? record.ownership_bps, normalizeOwnershipPercentage(record) * 100),
    ownershipPercentage: normalizeOwnershipPercentage(record),
    lastTokenTransactionId: optionalStr(record.lastTokenTransactionId ?? record.last_token_transaction_id),
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
    property: normalizeProperty(record.property),
    tokenization: normalizeTokenization(record.tokenization ?? record.propertyTokenization ?? record.property_tokenization),
  };
};

const normalizePropertyRelation = (relation: unknown): FmzAdminPropertyRelation | null => {
  const record = recordOf(relation);
  const id = str(record.id, str(record.propertyId ?? record.property_id));
  const propertyId = str(record.propertyId ?? record.property_id ?? recordOf(record.property).id);
  if (!id && !propertyId) return null;
  return {
    id,
    propertyId,
    userId: str(record.userId ?? record.user_id),
    relationType: str(record.relationType ?? record.relation_type, 'co_owner'),
    isActive: bool(record.isActive ?? record.is_active, true),
    validFrom: optionalStr(record.validFrom ?? record.valid_from),
    validTo: optionalStr(record.validTo ?? record.valid_to),
    metadata: recordOf(record.metadata),
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
    property: normalizeProperty(record.property),
  };
};

const normalizeTokenProfile = (profile: unknown): FmzAdminUserTokenProfile | null => {
  const record = recordOf(profile);
  if (!Object.keys(record).length) return null;
  return {
    userId: str(record.userId ?? record.user_id),
    investorProfile: optionalStr(record.investorProfile ?? record.investor_profile),
    kycStatus: str(record.kycStatus ?? record.kyc_status, 'pending'),
    isTokenEnabled: bool(record.isTokenEnabled ?? record.is_token_enabled, false),
    riskScore: record.riskScore ?? record.risk_score ? num(record.riskScore ?? record.risk_score) : null,
    metadata: recordOf(record.metadata),
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
  };
};

const defaultReadOnlyFields = (value: unknown): FmzAdminReadOnlyFields => {
  const record = recordOf(value);
  return {
    wallets: bool(record.wallets, true),
    coOwnerOwnershipPercentage: bool(record.coOwnerOwnershipPercentage ?? record.co_owner_ownership_percentage, true),
    tenantOwnershipPercentage: bool(record.tenantOwnershipPercentage ?? record.tenant_ownership_percentage, true),
  };
};

export const normalizeAdminUser = (user: unknown): FmzAdminUser => {
  const record = recordOf(user);
  const id = str(record.id, str(record._id, str(record.userId, str(record.user_id, str(record.email)))));
  const firstName = str(record.firstName, str(record.first_name));
  const lastName = str(record.lastName, str(record.last_name));
  const name = str(record.name, str(record.fullName, str(record.full_name, [firstName, lastName].filter(Boolean).join(' '))));
  const roleKeys = uniqueNormalizedArray(record.roleKeys, record.roles, record.role_keys, record.userRoles, record.user_roles, record.role);
  const permissionKeys = uniqueNormalizedArray(record.permissionKeys, record.permissions, record.permission_keys);
  const wallets = arr(record.wallets).map((wallet) => normalizeWallet(wallet, id)).filter((wallet): wallet is FmzAdminUserWallet => Boolean(wallet));
  const fallbackWallet = normalized(record.wallet ?? record.walletAddress ?? record.wallet_address);
  if (!wallets.length && fallbackWallet) {
    wallets.push({ id: fallbackWallet, userId: id, walletAddress: fallbackWallet, chainId: 137, walletType: 'user', custodyType: 'self_custody', verificationStatus: 'unverified', status: 'assigned' });
  }
  const tenantContracts = arr(record.tenantContracts ?? record.tenant_contracts ?? record.contracts).map(normalizeTenantContract).filter((contract): contract is FmzAdminTenantContract => Boolean(contract));
  const coOwnerProperties = arr(record.coOwnerProperties ?? record.co_owner_properties ?? record.propertyOwnerships ?? record.property_ownerships).map(normalizeCoOwnerProperty).filter((property): property is FmzAdminCoOwnerProperty => Boolean(property));
  const propertyRelations = arr(record.propertyRelations ?? record.property_relations).map(normalizePropertyRelation).filter((relation): relation is FmzAdminPropertyRelation => Boolean(relation));
  return {
    id,
    name,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    email: str(record.email),
    phone: optionalStr(record.phone ?? record.phone_e164 ?? record.phoneE164),
    phoneCountry: optionalStr(record.phoneCountry ?? record.phone_country),
    phoneDialCode: optionalStr(record.phoneDialCode ?? record.phone_dial_code),
    phoneNationalNumber: optionalStr(record.phoneNationalNumber ?? record.phone_national_number),
    phoneE164: optionalStr(record.phoneE164 ?? record.phone_e164),
    address: optionalStr(record.address),
    addressLine1: optionalStr(record.addressLine1 ?? record.address_line_1),
    addressLine2: optionalStr(record.addressLine2 ?? record.address_line_2),
    district: optionalStr(record.district),
    city: optionalStr(record.city),
    state: optionalStr(record.state),
    postalCode: optionalStr(record.postalCode ?? record.postal_code),
    country: optionalStr(record.country) ?? 'BR',
    birthdate: optionalStr(record.birthdate),
    role: str(record.role, roleKeys[0] ?? ''),
    roles: roleKeys,
    roleKeys,
    permissionKeys,
    permissions: permissionKeys,
    accessiblePages: normalizeAccessiblePages(record.accessiblePages ?? record.accessible_pages),
    isActive: statusOf(record.status ?? record.isActive ?? record.is_active) === 'active',
    status: statusOf(record.status ?? record.isActive ?? record.is_active),
    isAdmin: bool(record.isAdmin ?? record.is_admin, roleKeys.includes('admin')),
    profile: (record.profile ?? null) as number | string | null,
    wallets,
    wallet: fallbackWallet || wallets[0]?.walletAddress || null,
    walletAddress: normalized(record.walletAddress ?? record.wallet_address) || wallets[0]?.walletAddress || null,
    tokenProfile: normalizeTokenProfile(record.tokenProfile ?? record.token_profile),
    tenantContracts,
    contracts: tenantContracts,
    coOwnerProperties,
    propertyOwnerships: coOwnerProperties,
    propertyRelations,
    readOnlyFields: defaultReadOnlyFields(record.readOnlyFields ?? record.read_only_fields),
    failedLoginAttempts: num(record.failedLoginAttempts ?? record.failed_login_attempts, 0),
    lastFailedLoginAt: optionalStr(record.lastFailedLoginAt ?? record.last_failed_login_at),
    lockedUntil: optionalStr(record.lockedUntil ?? record.locked_until),
    lastLoginAt: optionalStr(record.lastLoginAt ?? record.last_login_at),
    createdAt: optionalStr(record.createdAt ?? record.created_at) ?? undefined,
    updatedAt: optionalStr(record.updatedAt ?? record.updated_at) ?? undefined,
  };
};

const stripReadOnlyPayload = (draft: FmzAdminUserDraft) => ({
  name: draft.name,
  email: draft.email,
  phone: draft.phone,
  phoneCountry: draft.phoneCountry ?? 'BR',
  status: draft.status,
  isActive: draft.status === 'active',
  roles: draft.roleKeys,
  roleKeys: draft.roleKeys,
  ...(draft.password?.trim() ? { password: draft.password.trim(), confirmPassword: draft.password.trim() } : {}),
  address: draft.address ?? '',
  addressLine1: draft.addressLine1 ?? '',
  addressLine2: draft.addressLine2 ?? '',
  district: draft.district ?? '',
  city: draft.city ?? '',
  state: draft.state ?? '',
  postalCode: draft.postalCode ?? '',
  country: draft.country ?? 'BR',
  birthdate: normalizeBirthdateForApi(draft.birthdate),
});

export async function getAdminUsers(request: FmzAdminPaginationRequest = {}): Promise<FmzPaginatedAdminResult<FmzAdminUser>> {
  const { data } = await firmezaApiClient.get(ADMIN_USERS_PATH, {
    params: buildAdminPaginationParams(request),
  });

  const result = normalizeAdminPaginatedPayload(
    data,
    ['users'],
    normalizeAdminUser,
    request,
  );

  return {
    ...result,
    items: result.items.filter((user) => Boolean(user.id || user.email)),
  };
}

export async function getAdminUser(userId: string): Promise<FmzAdminUser> {
  const { data } = await firmezaApiClient.get(`${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}`);
  return normalizeAdminUser(recordOf(data).user ?? recordOf(data).data ?? data);
}

export async function getAdminUserRoles(): Promise<FmzAccessControlRole[]> {
  const { data } = await firmezaApiClient.get(ADMIN_ROLES_PATH);
  return arrFromPayload<unknown>(data, ['roles']).map(normalizeRole);
}

export async function createAdminUser(draft: FmzAdminUserDraft): Promise<FmzAdminUser> {
  const { data } = await firmezaApiClient.post(ADMIN_USERS_PATH, stripReadOnlyPayload(draft));
  return normalizeAdminUser(recordOf(data).user ?? recordOf(data).data ?? data);
}

export async function updateAdminUser(draft: FmzAdminUserDraft): Promise<FmzAdminUser> {
  if (!draft.id) throw new Error('User id is required to update an admin user.');
  const { data } = await firmezaApiClient.patch(`${ADMIN_USERS_PATH}/${encodeURIComponent(draft.id)}`, stripReadOnlyPayload(draft));
  return normalizeAdminUser(recordOf(data).user ?? recordOf(data).data ?? data);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await firmezaApiClient.delete(`${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}`);
}

// Drawer's "Desativar/Reativar" toggle — only the status field, no need to round-trip the
// rest of the editable form (name/email/phone/address) like the create/edit wizard does.
export async function setAdminUserActiveStatus(userId: string, isActive: boolean): Promise<FmzAdminUser> {
  const { data } = await firmezaApiClient.patch(`${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}`, { isActive, status: isActive ? 'active' : 'inactive' });
  return normalizeAdminUser(recordOf(data).user ?? recordOf(data).data ?? data);
}

// Drawer's "Editar dados" small modal (reference: only name/email/phone) — only those 3
// fields, no need to round-trip the rest of the editable form like the create/edit wizard does.
export async function updateAdminUserContact(userId: string, contact: { name: string; email: string; phone: string }): Promise<FmzAdminUser> {
  const { data } = await firmezaApiClient.patch(`${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}`, contact);
  return normalizeAdminUser(recordOf(data).user ?? recordOf(data).data ?? data);
}

export type FmzAdminPasswordResetLink = { resetUrl: string; expiresAt: string | null };

// Backend mints the token and persists it but never sends an email — the admin is expected
// to copy resetUrl into the composer themselves (see propya-backend-api decision D-13).
export async function requestAdminUserPasswordResetLink(userId: string): Promise<FmzAdminPasswordResetLink> {
  const { data } = await firmezaApiClient.post(`${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}/password-reset-link`);
  const record = recordOf(data);
  return {
    resetUrl: str(record.resetUrl ?? record.reset_url),
    expiresAt: optionalStr(record.expiresAt ?? record.expires_at),
  };
}
