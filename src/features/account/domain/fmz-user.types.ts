import type { FmzAccessControlPage } from '../../access-control/domain';
import type { FmzApiResult } from '../../api-errors/domain';
import type { FmzNormalizedApiError } from '../../api-errors/domain';

export type UserType = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  birthdate?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  wallet?: string;
  createdAt?: string;
  profile?: number;
  roles?: string[];
  roleKeys?: string[];
  permissions?: string[];
  permissionKeys?: string[];
  accessiblePages?: FmzAccessControlPage[];
  isAdmin?: boolean;
};

export type UpdateUserResponse = FmzApiResult<{
  data?: {
    user?: UserType;
  };
}>;

export type ListUserResponse = {
  success: boolean;
  message: string;
  users?: UserType[];
  error?: FmzNormalizedApiError;
};
