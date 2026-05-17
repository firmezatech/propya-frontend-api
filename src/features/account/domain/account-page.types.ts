import type { UserType } from '../../../services/login-fmz-api';
import type { IdCard } from 'lucide-react';

export type AccountPageUser = UserType & {
  cpf?: string;
  walletNumber?: string;
  tokenBalance?: string | number;
  ownershipPercentage?: string | number;
};

export type PasswordVisibilityState = {
  current: boolean;
  next: boolean;
  confirmation: boolean;
};

export type PasswordBarKey = 'passwordBar' | 'passwordBarWeak' | 'passwordBarOk' | 'passwordBarStrong';

export type PasswordStrength = {
  score: number;
  label: string;
  barKey: PasswordBarKey;
};

export type AccountFieldErrors = Partial<Record<'currentPassword' | 'confirmPassword', string>>;

export type AccountDocumentStatus = 'approved' | 'review' | 'pending';

export type AccountDocument = {
  key: string;
  name: string;
  meta: string;
  status: AccountDocumentStatus;
  icon: typeof IdCard;
  toneClassName: string;
  canResend?: boolean;
  canUpload?: boolean;
};

export type AccountSidebarItem = {
  id: string;
  label: string;
  icon: typeof IdCard;
  hasDot?: boolean;
};
