'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FmzConnectedPageShell } from '../../../components/layout';
import { FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES } from '../../api-errors/domain';
import type { FmzNormalizedApiError } from '../../api-errors/domain';
import { updateUser } from '../services/fmz-user-api';
import { getCurrentAccountUser } from '../services/fmz-current-account-api';

import type { AccountFieldErrors, AccountPageUser, PasswordVisibilityState } from '../domain/fmz-account-page.types';
import { formatCepInput, normalizeBirthdateForForm, getPasswordStrength, sanitizeUserForForm } from '../domain/fmz-account-formatters';
import type { TenantUserData } from '../../tenant-portal/domain/fmz-tenant-profile.types';

import { useFmzTenantProfile } from '../hooks/fmz-tenant-profile';

import { FmzAccountSidebar } from './FmzAccountSidebar';
import { FmzAccountHeader } from './FmzAccountHeader';
import { FmzAccountKycProgressBanner } from './FmzAccountKycProgressBanner';
import { FmzPersonalDataCard } from './FmzPersonalDataCard';
import { FmzAddressCard } from './FmzAddressCard';
import { FmzWalletInfoCard } from './FmzWalletInfoCard';
import { FmzPasswordCard } from './FmzPasswordCard';
import { FmzKycDocumentsCard } from './FmzKycDocumentsCard';
import styles from './FmzAccountPage.module.css';

const EMPTY_PASSWORD_VISIBILITY: PasswordVisibilityState = { current: false, next: false, confirmation: false };

// ─── Profile → form mapping ───────────────────────────────────────────────────

/**
 * Builds a complete AccountPageUser form state directly from the backend profile.
 *
 * Single responsibility: field-name mapping + format normalisation.
 * This is the ONLY permitted source for personal and address data.
 * Wallet/CPF fields are supplemented separately and never override profile fields.
 */
function buildUserDataFromProfile(profileUser: TenantUserData): AccountPageUser {
  const addr = profileUser.address;
  return {
    _id: profileUser.id,
    name: profileUser.fullName,
    email: profileUser.email,
    phone: profileUser.phone ?? undefined,
    birthdate: normalizeBirthdateForForm(profileUser.birthdate) || undefined,
    addressLine1: addr.addressLine1 ?? undefined,
    addressLine2: addr.addressLine2 ?? undefined,
    district: addr.district ?? undefined,
    city: addr.city ?? undefined,
    state: addr.state ?? undefined,
    postalCode: addr.postalCode ? formatCepInput(addr.postalCode) : undefined,
    country: addr.country ?? 'BR',
    // Password fields are always blank on load
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
}

const buildSaveError = (description: string): FmzNormalizedApiError => ({
  code: FMZ_API_ERROR_CODES.UNKNOWN_ERROR,
  title: 'Não foi possível salvar',
  description,
  severity: 'error',
  fieldErrors: {},
});

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzAccountPage() {
  const t = useTranslations('MyAccount');
  const toastTimerRef = useRef<number | null>(null);

  // ── Primary source of truth: GET /tenant/profile ───────────────────────────
  const { profileState, uploadState, uploadKycDocument, refetchProfile } = useFmzTenantProfile();

  // Once the form is initialised from the first successful profile load, this
  // ref stays true. Profile refetches (e.g. after KYC upload) do not re-init
  // the form — they only refresh the KYC/completion section via profileState.
  const profileInitializedRef = useRef(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [initialUserData, setInitialUserData] = useState<AccountPageUser | null>(null);
  const [userData, setUserData] = useState<AccountPageUser | null>(null);
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AccountFieldErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibilityState>(EMPTY_PASSWORD_VISIBILITY);

  // ── Initialise form from profile (primary source, fires once) ─────────────
  useEffect(() => {
    if (profileState.status !== 'ready' || profileInitializedRef.current) return;
    profileInitializedRef.current = true;

    const fromProfile = buildUserDataFromProfile(profileState.data.profile.user);
    setUserData(fromProfile);
    setInitialUserData(fromProfile);
  // Only re-run when the status token changes; object identity is irrelevant.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileState.status]);

  // ── Supplement wallet/CPF data (secondary, non-blocking) ──────────────────
  // getCurrentAccountUser() still provides wallet address + CPF that the
  // profile endpoint does not include. Personal/address fields from this source
  // are intentionally IGNORED — they must not override the authoritative profile.
  useEffect(() => {
    let isMounted = true;

    getCurrentAccountUser()
      .then((account) => {
        if (!isMounted || !account) return;

        const walletOnly: Partial<AccountPageUser> = {
          wallet: account.wallet,
          cpf: (account as AccountPageUser).cpf,
          walletNumber: (account as AccountPageUser).walletNumber,
          tokenBalance: (account as AccountPageUser).tokenBalance,
          ownershipPercentage: (account as AccountPageUser).ownershipPercentage,
        };

        setUserData((current) => (current ? { ...current, ...walletOnly } : current));
        setInitialUserData((current) => (current ? { ...current, ...walletOnly } : current));
      })
      .catch(() => { /* wallet supplement failure is silent */ });

    return () => { isMounted = false; };
  // Deliberately empty: runs once on mount, never repeats.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast timer cleanup ────────────────────────────────────────────────────
  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────
  // Loading: profile hasn't resolved yet and there's no userData to show.
  // Error:   profile failed before the form was ever initialised.
  // After initialisation both states are suppressed — profile refetches happen
  // silently so the user doesn't lose their unsaved form edits.
  const isPageLoading = !userData && profileState.status !== 'error';
  const isPageError   = !userData && profileState.status === 'error';
  const profileData   = profileState.status === 'ready' ? profileState.data.profile : null;
  const profileErrorMessage = profileState.status === 'error' ? profileState.message : null;
  const uploadError   = uploadState.status === 'error' ? uploadState.message : null;

  // ── Form interactions ──────────────────────────────────────────────────────

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

  const discardFormChanges = useCallback(() => {
    setUserData(initialUserData);
    setFieldErrors({});
    setApiError(null);
    setPasswordVisibility(EMPTY_PASSWORD_VISIBILITY);
    showToast('Alterações descartadas.');
  }, [initialUserData, showToast]);

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

    const saved = response.data?.user
      ? sanitizeUserForForm(response.data.user)
      : sanitizeUserForForm(userData);

    setUserData(saved);
    setInitialUserData(saved);
    setFieldErrors({});
    setPasswordVisibility(EMPTY_PASSWORD_VISIBILITY);
    showToast(response.message || successMessage);
  }, [showToast, userData, validateForm]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <FmzConnectedPageShell width="tenant" className={styles.page}>
      <FmzAccountSidebar />

      <main className={styles.main}>
        <FmzAccountHeader />

        <FmzFormAlert error={apiError} />

        {/* Loading — profile hasn't resolved yet */}
        {isPageLoading ? (
          <div className={styles.stateCard}>
            <div className={styles.loadingContent}>
              <span className={styles.loadingSpinner} />
              Carregando dados da inquilina...
            </div>
          </div>
        ) : null}

        {/* Error — profile failed before form could be initialised */}
        {isPageError ? (
          <div className={styles.stateCard}>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertTriangle className="h-6 w-6 text-fmz-text-hint" aria-hidden="true" />
              <p className={styles.emptyText}>
                {profileErrorMessage ?? 'Não foi possível carregar os dados do perfil.'}
              </p>
              <button
                type="button"
                onClick={() => void refetchProfile()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-fmz-navy px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}

        {/* Content — profile loaded, form is ready */}
        {!isPageLoading && !isPageError && userData ? (
          <>
            {/* KYC progress banner — always driven by the latest profile data */}
            {profileData ? (
              <FmzAccountKycProgressBanner
                completion={profileData.completion}
                kycStatus={profileData.kyc.status}
              />
            ) : null}

            <FmzPersonalDataCard
              userData={userData}
              isSaving={isSaving}
              onFieldChange={updateUserField}
              onCancel={discardFormChanges}
              onSave={() => void handleSaveChanges('Dados pessoais salvos!')}
            />

            <FmzAddressCard
              userData={userData}
              isSaving={isSaving}
              onFieldChange={updateUserField}
              onCancel={discardFormChanges}
              onSave={() => void handleSaveChanges('Endereço salvo!')}
              onCepSearch={() => showToast('Buscando CEP...')}
            />

            <FmzWalletInfoCard userData={userData} />

            <FmzPasswordCard
              userData={userData}
              isSaving={isSaving}
              fieldErrors={fieldErrors}
              passwordStrength={passwordStrength}
              passwordVisibility={passwordVisibility}
              onFieldChange={updateUserField}
              onToggleVisibility={togglePasswordVisibility}
              onSave={() => void handleSaveChanges('Senha atualizada com sucesso!')}
            />

            {/* KYC documents — refreshed after uploads; shows isolated error on refetch failure */}
            {profileState.status === 'error' ? (
              <div className={styles.stateCard}>
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <AlertTriangle className="h-5 w-5 text-fmz-text-hint" aria-hidden="true" />
                  <p className={styles.emptyText}>
                    Não foi possível atualizar os documentos KYC.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetchProfile()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-fmz-navy px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Tentar novamente
                  </button>
                </div>
              </div>
            ) : (
              <FmzKycDocumentsCard
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
