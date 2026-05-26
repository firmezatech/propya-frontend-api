'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FmzConnectedPageShell } from '../../../components/layout';
import { FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES } from '../../api-errors/domain';
import type { FmzNormalizedApiError } from '../../api-errors/domain';
import { updateUser } from '../../../services/login-fmz-api';
import { getCurrentAccountUser } from '../services/fmz-current-account-api';

import type { AccountFieldErrors, AccountPageUser, PasswordVisibilityState } from '../domain/account-page.types';
import { formatCepInput, normalizeBirthdateForForm, getPasswordStrength, sanitizeUserForForm } from '../domain/account-formatters';

import { useTenantProfile } from '../hooks/use-tenant-profile';

import { AccountSidebar } from './AccountSidebar';
import { AccountHeader } from './AccountHeader';
import { AccountKycProgressBanner } from './AccountKycProgressBanner';
import { PersonalDataCard } from './PersonalDataCard';
import { AddressCard } from './AddressCard';
import { WalletInfoCard } from './WalletInfoCard';
import { PasswordCard } from './PasswordCard';
import { KycDocumentsCard } from './KycDocumentsCard';
import styles from './FmzAccountPage.module.css';

import type { TenantUserData } from '../../tenant-portal/domain/fmz-tenant-profile.types';

const EMPTY_PASSWORD_VISIBILITY: PasswordVisibilityState = { current: false, next: false, confirmation: false };

/**
 * Converts a backend `TenantUserData` object into a partial `AccountPageUser`
 * patch that can be merged into the form state.
 *
 * Single responsibility: field-name mapping + format normalisation.
 * Returns only the fields the backend profile actually provides; callers spread
 * the result over existing state so no form field is silently erased.
 */
function buildProfilePatchFromBackend(profileUser: TenantUserData): Partial<AccountPageUser> {
  const patch: Partial<AccountPageUser> = {};

  if (profileUser.id)        patch._id       = profileUser.id;
  if (profileUser.fullName)  patch.name      = profileUser.fullName;
  if (profileUser.email)     patch.email     = profileUser.email;
  if (profileUser.phone)     patch.phone     = profileUser.phone;
  if (profileUser.birthdate) patch.birthdate = normalizeBirthdateForForm(profileUser.birthdate) || undefined;

  const addr = profileUser.address;
  if (addr.addressLine1) patch.addressLine1 = addr.addressLine1;
  if (addr.addressLine2) patch.addressLine2 = addr.addressLine2;
  if (addr.district)     patch.district     = addr.district;
  if (addr.city)         patch.city         = addr.city;
  if (addr.state)        patch.state        = addr.state;
  if (addr.postalCode)   patch.postalCode   = formatCepInput(addr.postalCode);
  if (addr.country)      patch.country      = addr.country;

  return patch;
}

const buildLocalAccountError = (description: string): FmzNormalizedApiError => ({
  code: FMZ_API_ERROR_CODES.UNKNOWN_ERROR,
  title: 'Não foi possível salvar',
  description,
  severity: 'error',
  fieldErrors: {},
});

export function FmzAccountPage() {
  const common = useTranslations('Common');
  const t = useTranslations('MyAccount');
  const toastTimerRef = useRef<number | null>(null);

  // ── User form state ──────────────────────────────────────────────────────────
  const [initialUserData, setInitialUserData] = useState<AccountPageUser | null>(null);
  const [userData, setUserData] = useState<AccountPageUser | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AccountFieldErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibilityState>(EMPTY_PASSWORD_VISIBILITY);

  // ── Backend profile / KYC state (primary source of truth) ──────────────────
  const { profileState, uploadState, uploadKycDocument } = useTenantProfile();

  // Tracks whether we have already merged profile.user data into the form state.
  // Guards against re-applying on subsequent renders (e.g. profile refetch).
  const profileAppliedRef = useRef(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(userData?.newPassword ?? ''),
    [userData?.newPassword],
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const updateUserField = useCallback((field: keyof AccountPageUser, value: string) => {
    setUserData((current) => (current ? { ...current, [field]: value } : current));
    setApiError(null);
    setToastMessage(null);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const togglePasswordVisibility = useCallback((field: keyof PasswordVisibilityState) => {
    setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
  }, []);

  const resetPasswordFields = useCallback(() => {
    setUserData((current) => current ? { ...current, currentPassword: '', newPassword: '', confirmPassword: '' } : current);
    setFieldErrors({});
    setApiError(null);
    setPasswordVisibility(EMPTY_PASSWORD_VISIBILITY);
  }, []);

  const discardFormChanges = useCallback(() => {
    setUserData(initialUserData ? sanitizeUserForForm(initialUserData) : initialUserData);
    setFieldErrors({});
    setApiError(null);
    resetPasswordFields();
    showToast('Alterações descartadas.');
  }, [initialUserData, resetPasswordFields, showToast]);

  const validateForm = useCallback((): boolean => {
    const nextErrors: AccountFieldErrors = {};
    const isChangingPassword = Boolean(
      userData?.newPassword?.trim() || userData?.confirmPassword?.trim() || userData?.currentPassword?.trim(),
    );

    if (isChangingPassword && !userData?.currentPassword?.trim()) {
      nextErrors.currentPassword = t('errorCurrentPasswordRequired');
    }

    if (isChangingPassword && userData?.newPassword !== userData?.confirmPassword) {
      nextErrors.confirmPassword = 'As senhas não coincidem.';
    }

    if (isChangingPassword && (userData?.newPassword?.length ?? 0) < 8) {
      nextErrors.confirmPassword = nextErrors.confirmPassword ?? 'A nova senha precisa ter pelo menos 8 caracteres.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [t, userData?.confirmPassword, userData?.currentPassword, userData?.newPassword]);

  const handleSaveChanges = useCallback(async (successMessage: string) => {
    setApiError(null);
    if (!userData || !validateForm()) return;

    setIsSaving(true);
    const response = await updateUser(userData);
    setIsSaving(false);

    if (!response.success) {
      setApiError(response.error);
      return;
    }

    const sanitizedUser = response.data?.user
      ? sanitizeUserForForm(response.data.user)
      : sanitizeUserForForm(userData);

    setUserData(sanitizedUser);
    setInitialUserData(sanitizedUser);
    setFieldErrors({});
    setPasswordVisibility(EMPTY_PASSWORD_VISIBILITY);
    showToast(response.message || successMessage);
  }, [showToast, userData, validateForm]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      setIsLoadingUserData(true);
      const response = await getCurrentAccountUser();
      if (!isMounted) return;

      if (!response) {
        setApiError(buildLocalAccountError(common('errorLoadingData')));
        setUserData(null);
        setInitialUserData(null);
        setIsLoadingUserData(false);
        return;
      }

      const sanitizedUser = sanitizeUserForForm(response);
      setUserData(sanitizedUser);
      setInitialUserData(sanitizedUser);
      setApiError(null);
      setIsLoadingUserData(false);
    };

    void fetchUserData();

    return () => {
      isMounted = false;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [common]);

  // ── Hydrate form with authoritative backend profile data ─────────────────────
  // GET /tenant/profile is the primary source for personal data and address.
  // Applied once when the profile first loads; the ref guard prevents re-application
  // on subsequent renders even if profileState is a new object reference.
  useEffect(() => {
    if (profileState.status !== 'ready' || profileAppliedRef.current) return;
    profileAppliedRef.current = true;

    const profilePatch = buildProfilePatchFromBackend(profileState.data.profile.user);

    setInitialUserData((current) => (current ? { ...current, ...profilePatch } : current));
    setUserData((current) => (current ? { ...current, ...profilePatch } : current));
  // profileState.status is the only meaningful change signal — object identity is irrelevant.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileState.status]);

  // ── Derived profile data ─────────────────────────────────────────────────────
  const profileData = profileState.status === 'ready' ? profileState.data.profile : null;
  const isLoadingProfile = profileState.status === 'loading';
  const uploadError = uploadState.status === 'error' ? uploadState.message : null;

  return (
    <FmzConnectedPageShell width="tenant" className={styles.page}>
      <AccountSidebar />

      <main className={styles.main}>
        <AccountHeader />

        <FmzFormAlert error={apiError} />

        {isLoadingUserData || isLoadingProfile ? (
          <div className={styles.stateCard}>
            <div className={styles.loadingContent}>
              <span className={styles.loadingSpinner} />
              Carregando dados da inquilina...
            </div>
          </div>
        ) : null}

        {!isLoadingUserData && !userData ? (
          <div className={styles.stateCard}>
            <p className={styles.emptyText}>Não encontramos dados suficientes da inquilina para carregar esta página.</p>
          </div>
        ) : null}

        {!isLoadingUserData && userData ? (
          <>
            {/* KYC progress banner — driven by backend completion data */}
            {profileData ? (
              <AccountKycProgressBanner
                completion={profileData.completion}
                kycStatus={profileData.kyc.status}
              />
            ) : null}

            <PersonalDataCard
              userData={userData}
              isSaving={isSaving}
              onFieldChange={updateUserField}
              onCancel={discardFormChanges}
              onSave={() => void handleSaveChanges('Dados pessoais salvos!')}
            />

            <AddressCard
              userData={userData}
              isSaving={isSaving}
              onFieldChange={updateUserField}
              onCancel={discardFormChanges}
              onSave={() => void handleSaveChanges('Endereço salvo!')}
              onCepSearch={() => showToast('Buscando CEP...')}
            />

            <WalletInfoCard userData={userData} />

            <PasswordCard
              userData={userData}
              isSaving={isSaving}
              fieldErrors={fieldErrors}
              passwordStrength={passwordStrength}
              passwordVisibility={passwordVisibility}
              onFieldChange={updateUserField}
              onToggleVisibility={togglePasswordVisibility}
              onSave={() => void handleSaveChanges('Senha atualizada com sucesso!')}
            />

            {/* KYC documents card — driven by backend document list */}
            {profileState.status === 'error' ? (
              <div className={styles.stateCard}>
                <p className={styles.emptyText}>
                  Não foi possível carregar os documentos KYC. Recarregue a página para tentar novamente.
                </p>
              </div>
            ) : (
              <KycDocumentsCard
                documents={profileData?.kyc.documents ?? []}
                onUpload={uploadKycDocument}
                onToast={showToast}
                isUploading={uploadState.status === 'uploading'}
                uploadError={uploadError}
              />
            )}
          </>
        ) : null}
      </main>

      <div className={`${styles.toast} ${toastMessage ? styles.toastVisible : ''}`}>
        <CheckCircle aria-hidden="true" />
        <span>{toastMessage ?? 'Salvo!'}</span>
      </div>
    </FmzConnectedPageShell>
  );
}
