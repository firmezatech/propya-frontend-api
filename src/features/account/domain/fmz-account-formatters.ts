import { formatBirthdateInput } from '../../../lib/fmz-phone-country-format';
import type { AccountPageUser, PasswordBarKey, PasswordStrength } from './account-page.types';
import type { UserType } from './fmz-user.types';

export const normalizeBirthdateForForm = (value: string | null | undefined): string => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  if (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(rawValue)) return rawValue;

  return formatBirthdateInput(rawValue);
};

export const formatCepInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const maskCpf = (cpf?: string | null): string => {
  const digits = String(cpf ?? '').replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.***-**';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
};

export const formatWalletNumber = (user: AccountPageUser): string => {
  if (user.walletNumber) return user.walletNumber;
  if (!user.wallet) return 'Carteira não informada';
  return `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`;
};

export const formatWalletSub = (user: AccountPageUser): string => {
  const tokenBalance = user.tokenBalance ? `${user.tokenBalance} tokens` : 'Tokens vinculados à conta';
  const ownership = user.ownershipPercentage ? `${user.ownershipPercentage}% do imóvel` : 'participação conforme contrato';
  return `${tokenBalance} · ${ownership}`;
};

export const sanitizeUserForForm = (user: UserType): AccountPageUser => ({
  ...user,
  birthdate: normalizeBirthdateForForm(user.birthdate),
  postalCode: user.postalCode ? formatCepInput(user.postalCode) : '',
  country: user.country || 'BR',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: 'Digite sua nova senha', barKey: 'passwordBar' };

  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = rules.filter(Boolean).length;

  if (score <= 1) return { score, label: 'Muito fraca', barKey: 'passwordBarWeak' };
  if (score <= 3) return { score, label: score === 2 ? 'Razoável' : 'Boa', barKey: 'passwordBarOk' };
  return { score, label: 'Forte', barKey: 'passwordBarStrong' };
};

export const resolvePasswordBarClass = (barKey: PasswordBarKey, cssModule: Record<string, string>): string => (
  cssModule[barKey] ?? ''
);
