import type { FmzAccessControlRole } from '../../access-control/domain';

export type FmzAdminUserStatus = 'active' | 'inactive';

export type FmzAdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  wallet: string;
  status: FmzAdminUserStatus;
  roleKeys: string[];
  createdAt?: string;
};

export type FmzAdminUserDraft = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  status: FmzAdminUserStatus;
  roleKeys: string[];
};

export type FmzAdminUserRole = FmzAccessControlRole;
