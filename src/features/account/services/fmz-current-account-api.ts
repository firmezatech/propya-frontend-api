import { fmzPublicLayoutConfig } from '../../../config/fmz-public-layout-config';
import { getCurrentAccessControlPrincipal } from '../../access-control/services';
import { getTenantDashboardData } from '../../renter-dashboard/services/fmz-tenant-dashboard-api';
import { getUserByWallet, type UserType } from '../../../services/login-fmz-api';

type StoredAccountSnapshot = Pick<UserType, 'name' | 'email' | 'wallet' | 'profile'>;

const isBrowser = (): boolean => typeof window !== 'undefined';

const getStoredValue = (key: string): string => {
  if (!isBrowser()) return '';
  return window.localStorage.getItem(key)?.trim() ?? '';
};

const getStoredAccountSnapshot = (): StoredAccountSnapshot => ({
  name: getStoredValue(fmzPublicLayoutConfig.connectedUserNameStorageKey),
  email: getStoredValue(fmzPublicLayoutConfig.connectedUserEmailStorageKey),
  wallet: getStoredValue(fmzPublicLayoutConfig.connectedUserWalletStorageKey),
  profile: getStoredValue(fmzPublicLayoutConfig.connectedUserProfileStorageKey),
});

const firstNonEmpty = (...values: Array<string | null | undefined>): string | undefined => (
  values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim()
);

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
    const tenantDashboard = await getTenantDashboardData(null);
    return {
      name: tenantDashboard.renterName ?? undefined,
      wallet,
    };
  } catch {
    return null;
  }
}

export async function getCurrentAccountUser(): Promise<UserType | null> {
  const storedAccount = getStoredAccountSnapshot();
  const wallet = firstNonEmpty(storedAccount.wallet);

  const [userFromWallet, userFromPrincipal] = await Promise.all([
    wallet ? getUserByWallet(wallet) : Promise.resolve(null),
    getPrincipalUser(wallet),
  ]);
  const userFromTenantDashboard = await getTenantDashboardUser(wallet, userFromPrincipal);

  const user = mergeAccountData(
    storedAccount,
    userFromPrincipal,
    userFromTenantDashboard,
    userFromWallet,
  );

  return Object.keys(user).length > 0 ? user : null;
}
