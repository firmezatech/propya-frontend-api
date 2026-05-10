import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import { getCurrentAccessControlPrincipal } from '../../access-control/services';
import { getCurrentTenantDashboard } from '../../tenant-portal/services';
import { getUserByWallet, type UserType } from '../../../services/login-fmz-api';

type StoredAccountSnapshot = Pick<UserType, 'name' | 'email' | 'wallet'> & { profile?: number };
type UnknownRecord = Record<string, unknown>;

const isBrowser = (): boolean => typeof window !== 'undefined';

const recordOf = (value: unknown): UnknownRecord => (value && typeof value === 'object' ? value as UnknownRecord : {});

const getStoredValue = (key: string): string => {
  if (!isBrowser()) return '';
  return window.localStorage.getItem(key)?.trim() ?? '';
};

const getStoredNumber = (key: string): number | undefined => {
  const numericValue = Number(getStoredValue(key));
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const getStoredAccountSnapshot = (): StoredAccountSnapshot => ({
  name: getStoredValue(fmzPublicLayoutConfig.connectedUserNameStorageKey),
  email: getStoredValue(fmzPublicLayoutConfig.connectedUserEmailStorageKey),
  wallet: getStoredValue(fmzPublicLayoutConfig.connectedUserWalletStorageKey),
  profile: getStoredNumber(fmzPublicLayoutConfig.connectedUserProfileStorageKey),
});

const firstNonEmpty = (...values: Array<string | null | undefined>): string | undefined => (
  values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim()
);

const optionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

const pickString = (source: UnknownRecord, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = optionalString(source[key]);
    if (value) return value;
  }

  return undefined;
};

const hasTenantRole = (user: Partial<UserType> | null): boolean => (
  new Set([...(user?.roleKeys ?? []), ...(user?.roles ?? [])].map((role) => role.trim().toLowerCase())).has('tenant')
);

const mergeAccountData = (...sources: Array<Partial<UserType> | null | undefined>): UserType => {
  const merged = sources.reduce<UserType>((account, source) => {
    if (!source) return account;

    return {
      ...account,
      ...Object.fromEntries(
        Object.entries(source).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ''),
      ),
    };
  }, {});

  return merged;
};

const buildAddressSummary = (tenant: UnknownRecord): string | undefined => firstNonEmpty(
  pickString(tenant, 'address', 'fullAddress', 'full_address'),
  [
    pickString(tenant, 'addressLine1', 'address_line_1', 'address_line1'),
    pickString(tenant, 'addressNumber', 'address_number'),
    pickString(tenant, 'addressLine2', 'address_line_2', 'address_line2'),
    pickString(tenant, 'district', 'neighborhood', 'bairro'),
    pickString(tenant, 'city', 'cidade'),
    pickString(tenant, 'state', 'uf', 'estado'),
    pickString(tenant, 'postalCode', 'postal_code', 'zipcode', 'zipCode', 'cep'),
  ].filter(Boolean).join(', '),
);

const buildTenantAccountFromDashboard = (tenant: UnknownRecord, wallet?: string): UserType | null => {
  if (Object.keys(tenant).length === 0) return null;

  return {
    _id: pickString(tenant, 'id', '_id', 'userId', 'user_id'),
    name: pickString(tenant, 'name', 'fullName', 'full_name'),
    email: pickString(tenant, 'email'),
    phone: pickString(tenant, 'phone', 'phoneNumber', 'phone_number'),
    phoneCountry: pickString(tenant, 'phoneCountry', 'phone_country'),
    birthdate: pickString(tenant, 'birthdate', 'birthDate', 'birth_date', 'dateOfBirth', 'date_of_birth'),
    wallet: firstNonEmpty(wallet, pickString(tenant, 'wallet', 'walletAddress', 'wallet_address')),
    address: buildAddressSummary(tenant),
    addressLine1: pickString(tenant, 'addressLine1', 'address_line_1', 'address_line1'),
    addressLine2: pickString(tenant, 'addressLine2', 'address_line_2', 'address_line2', 'complement'),
    district: pickString(tenant, 'district', 'neighborhood', 'bairro'),
    city: pickString(tenant, 'city', 'cidade'),
    state: pickString(tenant, 'state', 'uf', 'estado'),
    postalCode: pickString(tenant, 'postalCode', 'postal_code', 'zipcode', 'zipCode', 'cep'),
    country: pickString(tenant, 'country', 'pais') ?? 'BR',
  };
};

async function getPrincipalUser(wallet?: string): Promise<UserType | null> {
  try {
    const principal = await getCurrentAccessControlPrincipal();
    return {
      name: principal.name,
      email: principal.email,
      wallet,
      roles: principal.roleKeys,
      roleKeys: principal.roleKeys,
      permissions: principal.permissionKeys,
      permissionKeys: principal.permissionKeys,
      accessiblePages: principal.accessiblePages,
      isAdmin: principal.isAdmin,
    };
  } catch {
    return null;
  }
}

async function getTenantDashboardUser(wallet?: string, principalUser?: UserType | null): Promise<UserType | null> {
  if (!hasTenantRole(principalUser ?? null)) return null;

  try {
    const dashboard = await getCurrentTenantDashboard();
    const tenant = recordOf(dashboard?.tenant);
    return buildTenantAccountFromDashboard(tenant, wallet);
  } catch {
    return null;
  }
}

export async function getCurrentAccountUser(): Promise<UserType | null> {
  const storedAccount = getStoredAccountSnapshot();
  const wallet = firstNonEmpty(storedAccount.wallet);

  const [rawUserFromWallet, userFromPrincipal] = await Promise.all([
    wallet ? getUserByWallet(wallet) : Promise.resolve(null),
    getPrincipalUser(wallet),
  ]);
  const userFromWallet = rawUserFromWallet
    ? mergeAccountData(rawUserFromWallet, buildTenantAccountFromDashboard(recordOf(rawUserFromWallet), wallet))
    : null;
  const userFromTenantDashboard = await getTenantDashboardUser(wallet, userFromPrincipal);

  const user = mergeAccountData(
    storedAccount,
    userFromPrincipal,
    userFromTenantDashboard,
    userFromWallet,
  );

  return Object.keys(user).length > 0 ? user : null;
}
