'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { FmzButton, FmzCard, FmzCardHeader, FmzPasswordVisibilityButton, FmzTextInput } from '../../../../components/design-system';
import { FmzConnectedPageShell } from '../../../../components/layout';
import { FmzFormAlert } from '../../../../features/api-errors/components';
import { FMZ_API_ERROR_CODES } from '../../../../features/api-errors/domain';
import type { FmzNormalizedApiError } from '../../../../features/api-errors/domain';
import { formatBirthdateInput } from '../../../../services/phone-country-format';
import { updateUser, type UserType } from '../../../../services/login-fmz-api';
import { getCurrentAccountUser } from '../../../../features/account/services/fmz-current-account-api';

type PasswordVisibilityState = {
  current: boolean;
  next: boolean;
  confirmation: boolean;
};

type PasswordStrength = {
  score: number;
  label: string;
  className: string;
};

type AccountFieldErrors = Partial<Record<'currentPassword' | 'confirmPassword', string>>;

const emptyPasswordVisibility: PasswordVisibilityState = {
  current: false,
  next: false,
  confirmation: false,
};

const buildLocalAccountError = (description: string): FmzNormalizedApiError => ({
  code: FMZ_API_ERROR_CODES.UNKNOWN_ERROR,
  title: 'Não foi possível salvar',
  description,
  severity: 'error',
  fieldErrors: {},
});

const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: '—', className: 'bg-fmz-border-light' };

  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = rules.filter(Boolean).length;

  if (score <= 1) return { score, label: 'Fraca', className: 'bg-fmz-error' };
  if (score <= 2) return { score, label: 'Média', className: 'bg-[#C97B10]' };
  return { score, label: 'Forte', className: 'bg-fmz-success' };
};


const normalizeBirthdateForForm = (value: string | null | undefined): string => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const brMatch = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return rawValue;

  return formatBirthdateInput(rawValue);
};

const formatCepInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const sanitizeUserForForm = (user: UserType): UserType => ({
  ...user,
  birthdate: normalizeBirthdateForForm(user.birthdate),
  postalCode: user.postalCode ? formatCepInput(user.postalCode) : '',
  country: user.country || 'BR',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export default function MyAccountPage() {
  const t = useTranslations('MyAccount');
  const common = useTranslations('Common');
  const router = useRouter();

  const [userData, setUserData] = useState<UserType | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AccountFieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibilityState>(emptyPasswordVisibility);

  const passwordStrength = useMemo(() => getPasswordStrength(userData?.newPassword ?? ''), [userData?.newPassword]);

  const updateUserField = useCallback((field: keyof UserType, value: string) => {
    setUserData((currentUser) => (currentUser ? { ...currentUser, [field]: value } : currentUser));
    setApiError(null);
    setSuccessMessage(null);
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }, []);

  const togglePasswordVisibility = useCallback((field: keyof PasswordVisibilityState) => {
    setPasswordVisibility((currentState) => ({ ...currentState, [field]: !currentState[field] }));
  }, []);

  const resetPasswordFields = useCallback(() => {
    setUserData((currentUser) => (currentUser
      ? { ...currentUser, currentPassword: '', newPassword: '', confirmPassword: '' }
      : currentUser));
    setFieldErrors({});
    setApiError(null);
    setSuccessMessage(null);
    setPasswordVisibility(emptyPasswordVisibility);
  }, []);

  const validateAccountForm = useCallback((): boolean => {
    const nextFieldErrors: AccountFieldErrors = {};

    const isChangingPassword = Boolean(userData?.newPassword?.trim() || userData?.confirmPassword?.trim());

    if (isChangingPassword && !userData?.currentPassword?.trim()) {
      nextFieldErrors.currentPassword = t('errorCurrentPasswordRequired');
    }

    if (isChangingPassword && userData?.newPassword !== userData?.confirmPassword) {
      nextFieldErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length === 0;
  }, [t, userData?.confirmPassword, userData?.currentPassword, userData?.newPassword]);

  const handleSaveChanges = useCallback(async () => {
    setApiError(null);
    setSuccessMessage(null);

    if (!userData || !validateAccountForm()) return;

    setIsSaving(true);
    const response = await updateUser(userData);
    setIsSaving(false);

    if (!response.success) {
      setApiError(response.error);
      return;
    }

    setUserData(response.data?.user ? sanitizeUserForForm(response.data.user) : sanitizeUserForForm(userData));
    setSuccessMessage(response.message || t('saveSuccess'));
    setFieldErrors({});
    setPasswordVisibility(emptyPasswordVisibility);
  }, [t, userData, validateAccountForm]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      setIsLoadingUserData(true);
      const response = await getCurrentAccountUser();
      if (!isMounted) return;

      if (!response) {
        setApiError(buildLocalAccountError(common('errorLoadingData')));
        setUserData(null);
        setIsLoadingUserData(false);
        return;
      }

      setUserData(sanitizeUserForForm(response));
      setApiError(null);
      setIsLoadingUserData(false);
    };

    void fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [common]);

  return (
    <FmzConnectedPageShell width="default">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-7 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-fmz-text-hint transition hover:text-fmz-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar
      </button>

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-fmz-text-hint">Configurações</p>
          <h1 className="font-syne text-3xl font-extrabold tracking-[-0.025em] text-fmz-navy">{t('title')}</h1>
        </div>
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-fmz-success-border bg-fmz-success-bg px-3 py-1.5 text-xs font-medium text-fmz-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fmz-success" />
          Conta ativa
        </div>
      </div>

      <FmzFormAlert error={apiError} />

      {isLoadingUserData ? (
        <FmzCard>
          <div className="flex min-h-[160px] items-center justify-center gap-3 text-sm text-fmz-text-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-fmz-border-light border-t-fmz-navy" />
            Carregando dados da inquilina...
          </div>
        </FmzCard>
      ) : userData ? (
        <>
          <FmzCard>
            <FmzCardHeader
              icon={<UserRound className="h-[18px] w-[18px]" aria-hidden="true" />}
              title="Dados Pessoais"
              subtitle="Informações visíveis no seu perfil"
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">
                  {t('labelName')} <span className="text-fmz-gold-dark">*</span>
                </span>
                <FmzTextInput
                  value={userData.name ?? ''}
                  onChange={(event) => updateUserField('name', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">
                  {t('labelPhone')} <span className="text-fmz-gold-dark">*</span>
                </span>
                <FmzTextInput
                  type="tel"
                  value={userData.phone ?? ''}
                  onChange={(event) => updateUserField('phone', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">
                  {t('labelBirthdate')} <span className="text-fmz-gold-dark">*</span>
                </span>
                <FmzTextInput
                  value={userData.birthdate ?? ''}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  onChange={(event) => updateUserField('birthdate', formatBirthdateInput(event.target.value))}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">
                  {t('labelEmail')} <span className="text-fmz-gold-dark">*</span>
                </span>
                <FmzTextInput type="email" value={userData.email ?? ''} disabled />
                <span className="mt-1.5 block text-[11.5px] text-fmz-text-hint">O e-mail não pode ser alterado.</span>
              </label>
            </div>
          </FmzCard>

          <FmzCard>
            <FmzCardHeader
              icon={<MapPin className="h-[18px] w-[18px]" aria-hidden="true" />}
              title="Endereço"
              subtitle="Endereço residencial usado para cadastro e comunicação da inquilina"
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">Endereço completo</span>
                <FmzTextInput
                  value={userData.address ?? ''}
                  placeholder="Rua, número, complemento"
                  onChange={(event) => updateUserField('address', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">Logradouro</span>
                <FmzTextInput
                  value={userData.addressLine1 ?? ''}
                  placeholder="Ex: Rua Firmeza"
                  onChange={(event) => updateUserField('addressLine1', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">Complemento</span>
                <FmzTextInput
                  value={userData.addressLine2 ?? ''}
                  placeholder="Apto, bloco, casa"
                  onChange={(event) => updateUserField('addressLine2', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">Bairro</span>
                <FmzTextInput
                  value={userData.district ?? ''}
                  placeholder="Centro"
                  onChange={(event) => updateUserField('district', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">Cidade</span>
                <FmzTextInput
                  value={userData.city ?? ''}
                  placeholder="São Paulo"
                  onChange={(event) => updateUserField('city', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">Estado</span>
                <FmzTextInput
                  value={userData.state ?? ''}
                  placeholder="SP"
                  maxLength={2}
                  onChange={(event) => updateUserField('state', event.target.value.toUpperCase())}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">CEP</span>
                <FmzTextInput
                  value={userData.postalCode ?? ''}
                  placeholder="00000-000"
                  maxLength={9}
                  onChange={(event) => updateUserField('postalCode', formatCepInput(event.target.value))}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">País</span>
                <FmzTextInput
                  value={userData.country ?? 'BR'}
                  placeholder="BR"
                  onChange={(event) => updateUserField('country', event.target.value.toUpperCase())}
                />
              </label>
            </div>
          </FmzCard>

          <FmzCard>
            <FmzCardHeader
              icon={<ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />}
              title="Segurança"
              subtitle="Atualize sua senha quando quiser"
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">
                  {t('labelCurrentPassword')} <span className="text-fmz-gold-dark">*</span>
                </span>
                <span className="relative block">
                  <FmzTextInput
                    type={passwordVisibility.current ? 'text' : 'password'}
                    value={userData.currentPassword ?? ''}
                    hasError={Boolean(fieldErrors.currentPassword)}
                    autoComplete="current-password"
                    className="pr-11"
                    placeholder="Obrigatória apenas para alterar a senha"
                    onChange={(event) => updateUserField('currentPassword', event.target.value)}
                  />
                  <FmzPasswordVisibilityButton
                    isVisible={passwordVisibility.current}
                    onClick={() => togglePasswordVisibility('current')}
                  />
                </span>
                {fieldErrors.currentPassword ? <span className="mt-1.5 block text-xs text-fmz-error">{fieldErrors.currentPassword}</span> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">{t('labelNewPassword')}</span>
                <span className="relative block">
                  <FmzTextInput
                    type={passwordVisibility.next ? 'text' : 'password'}
                    value={userData.newPassword ?? ''}
                    autoComplete="new-password"
                    className="pr-11"
                    placeholder="Mínimo 8 caracteres"
                    onChange={(event) => updateUserField('newPassword', event.target.value)}
                  />
                  <FmzPasswordVisibilityButton
                    isVisible={passwordVisibility.next}
                    onClick={() => togglePasswordVisibility('next')}
                  />
                </span>
                {userData.newPassword ? (
                  <div className="mt-2">
                    <div className="mb-1 flex gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`h-[3px] flex-1 rounded-sm ${index < passwordStrength.score ? passwordStrength.className : 'bg-fmz-border-light'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11.5px] text-fmz-text-hint">{passwordStrength.label}</span>
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-fmz-text-muted">{t('labelConfirmPassword')}</span>
                <span className="relative block">
                  <FmzTextInput
                    type={passwordVisibility.confirmation ? 'text' : 'password'}
                    value={userData.confirmPassword ?? ''}
                    hasError={Boolean(fieldErrors.confirmPassword)}
                    autoComplete="new-password"
                    className="pr-11"
                    placeholder="Repita a nova senha"
                    onChange={(event) => updateUserField('confirmPassword', event.target.value)}
                  />
                  <FmzPasswordVisibilityButton
                    isVisible={passwordVisibility.confirmation}
                    onClick={() => togglePasswordVisibility('confirmation')}
                  />
                </span>
                {fieldErrors.confirmPassword ? <span className="mt-1.5 block text-xs text-fmz-error">{fieldErrors.confirmPassword}</span> : null}
              </label>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-fmz-border-light pt-6">
              <button
                type="button"
                onClick={resetPasswordFields}
                className="border-0 bg-transparent p-0 text-sm font-medium text-fmz-text-hint transition hover:text-fmz-text-primary"
              >
                Descartar alterações
              </button>
              <FmzButton type="button" className="w-auto px-8" disabled={isSaving} onClick={handleSaveChanges}>
                <Check className="h-[15px] w-[15px]" aria-hidden="true" />
                {isSaving ? 'Salvando...' : t('saveChanges')}
              </FmzButton>
            </div>
          </FmzCard>
        </>
      ) : (
        <FmzCard>
          <p className="text-sm text-fmz-text-muted">Não encontramos dados suficientes da inquilina para carregar esta página.</p>
        </FmzCard>
      )}

      {successMessage ? (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl bg-fmz-navy px-5 py-3.5 text-sm font-medium text-white shadow-lg">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fmz-gold text-fmz-navy">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
          {successMessage}
        </div>
      ) : null}
    </FmzConnectedPageShell>
  );
}
