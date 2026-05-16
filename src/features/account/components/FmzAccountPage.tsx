'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileText,
  FileX,
  FolderOpen,
  Gem,
  IdCard,
  Info,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  UploadCloud,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { FmzConnectedPageShell } from '../../../components/layout';
import { FmzFormAlert } from '../../api-errors/components';
import { FMZ_API_ERROR_CODES } from '../../api-errors/domain';
import type { FmzNormalizedApiError } from '../../api-errors/domain';
import { formatBirthdateInput } from '../../../services/phone-country-format';
import { updateUser, type UserType } from '../../../services/login-fmz-api';
import { getCurrentAccountUser } from '../services/fmz-current-account-api';
import styles from './FmzAccountPage.module.css';

type AccountPageUser = UserType & {
  cpf?: string;
  walletNumber?: string;
  tokenBalance?: string | number;
  ownershipPercentage?: string | number;
};

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

type AccountDocumentStatus = 'approved' | 'review' | 'pending';

type AccountDocument = {
  key: string;
  name: string;
  meta: string;
  status: AccountDocumentStatus;
  icon: typeof IdCard;
  toneClassName: string;
  canResend?: boolean;
  canUpload?: boolean;
};

const BRAZILIAN_STATES = [
  { value: '', label: 'Selecione...' },
  { value: 'AC', label: 'Acre — AC' },
  { value: 'AL', label: 'Alagoas — AL' },
  { value: 'AP', label: 'Amapá — AP' },
  { value: 'AM', label: 'Amazonas — AM' },
  { value: 'BA', label: 'Bahia — BA' },
  { value: 'CE', label: 'Ceará — CE' },
  { value: 'DF', label: 'Distrito Federal — DF' },
  { value: 'ES', label: 'Espírito Santo — ES' },
  { value: 'GO', label: 'Goiás — GO' },
  { value: 'MA', label: 'Maranhão — MA' },
  { value: 'MT', label: 'Mato Grosso — MT' },
  { value: 'MS', label: 'Mato Grosso do Sul — MS' },
  { value: 'MG', label: 'Minas Gerais — MG' },
  { value: 'PA', label: 'Pará — PA' },
  { value: 'PB', label: 'Paraíba — PB' },
  { value: 'PR', label: 'Paraná — PR' },
  { value: 'PE', label: 'Pernambuco — PE' },
  { value: 'PI', label: 'Piauí — PI' },
  { value: 'RJ', label: 'Rio de Janeiro — RJ' },
  { value: 'RN', label: 'Rio Grande do Norte — RN' },
  { value: 'RS', label: 'Rio Grande do Sul — RS' },
  { value: 'RO', label: 'Rondônia — RO' },
  { value: 'RR', label: 'Roraima — RR' },
  { value: 'SC', label: 'Santa Catarina — SC' },
  { value: 'SP', label: 'São Paulo — SP' },
  { value: 'SE', label: 'Sergipe — SE' },
  { value: 'TO', label: 'Tocantins — TO' },
] as const;

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
  if (!password) return { score: 0, label: 'Digite sua nova senha', className: styles.passwordBar };

  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = rules.filter(Boolean).length;

  if (score <= 1) return { score, label: 'Muito fraca', className: styles.passwordBarWeak };
  if (score <= 3) return { score, label: score === 2 ? 'Razoável' : 'Boa', className: styles.passwordBarOk };
  return { score, label: 'Forte', className: styles.passwordBarStrong };
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

const maskCpf = (cpf?: string | null): string => {
  const digits = String(cpf ?? '').replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.***-**';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
};

const formatWalletNumber = (user: AccountPageUser): string => {
  if (user.walletNumber) return user.walletNumber;
  if (!user.wallet) return 'Carteira não informada';
  return `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`;
};

const formatWalletSub = (user: AccountPageUser): string => {
  const tokenBalance = user.tokenBalance ? `${user.tokenBalance} tokens` : 'Tokens vinculados à conta';
  const ownership = user.ownershipPercentage ? `${user.ownershipPercentage}% do imóvel` : 'participação conforme contrato';
  return `${tokenBalance} · ${ownership}`;
};

const sanitizeUserForForm = (user: UserType): AccountPageUser => ({
  ...user,
  birthdate: normalizeBirthdateForForm(user.birthdate),
  postalCode: user.postalCode ? formatCepInput(user.postalCode) : '',
  country: user.country || 'BR',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const accountDocuments: AccountDocument[] = [
  {
    key: 'identity-document',
    name: 'RG ou CNH (frente e verso)',
    meta: 'Documento de identificação enviado para verificação',
    status: 'approved',
    icon: IdCard,
    toneClassName: styles.bgGreen,
  },
  {
    key: 'selfie-document',
    name: 'Selfie segurando o documento',
    meta: 'Selfie enviada para validação de identidade',
    status: 'approved',
    icon: Camera,
    toneClassName: styles.bgGreen,
  },
  {
    key: 'proof-of-address',
    name: 'Comprovante de residência',
    meta: 'Em análise pela equipe',
    status: 'review',
    icon: FileText,
    toneClassName: styles.bgOrange,
    canResend: true,
  },
  {
    key: 'income-tax-document',
    name: 'Declaração de Imposto de Renda',
    meta: 'Não enviado · Necessário para transações acima de R$ 5.000/mês',
    status: 'pending',
    icon: FileX,
    toneClassName: styles.bgRed,
    canUpload: true,
  },
];

const documentStatusVisual: Record<AccountDocumentStatus, { label: string; className: string; icon: typeof CheckCircle }> = {
  approved: { label: 'Aprovado', className: styles.badgeGreen, icon: CheckCircle },
  review: { label: 'Em análise', className: styles.badgeOrange, icon: Clock },
  pending: { label: 'Pendente', className: styles.badgeRed, icon: AlertCircle },
};

type FieldShellProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
};

function FieldShell({ label, required, children, hint, error, className = '' }: FieldShellProps) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span className={styles.fieldLabel}>{label} {required ? <span className={styles.req}>*</span> : null}</span>
      {children}
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
      {error ? <span className={styles.fieldError}>{error}</span> : null}
    </label>
  );
}

type SectionBlockProps = {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function SectionBlock({ icon, iconClassName, title, subtitle, children }: SectionBlockProps) {
  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHead}>
        <span className={`${styles.sectionIcon} ${iconClassName}`}>{icon}</span>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDesc}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function PasswordStrengthBars({ strength }: { strength: PasswordStrength }) {
  return (
    <div>
      <div className={styles.passwordBars}>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`${styles.passwordBar} ${index < strength.score ? strength.className : ''}`}
          />
        ))}
      </div>
      <div className={styles.passwordHint}>{strength.label}</div>
    </div>
  );
}

function LoadingAccountState() {
  return (
    <div className={styles.loadingCard}>
      <div className={styles.loadingContent}>
        <span className={styles.loadingSpinner} />
        Carregando dados da inquilina...
      </div>
    </div>
  );
}

function EmptyAccountState() {
  return <div className={styles.emptyCard}>Não encontramos dados suficientes da inquilina para carregar esta página.</div>;
}

export function FmzAccountPage() {
  const t = useTranslations('MyAccount');
  const common = useTranslations('Common');
  const router = useRouter();
  const toastTimerRef = useRef<number | null>(null);

  const [initialUserData, setInitialUserData] = useState<AccountPageUser | null>(null);
  const [userData, setUserData] = useState<AccountPageUser | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [apiError, setApiError] = useState<FmzNormalizedApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AccountFieldErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibilityState>(emptyPasswordVisibility);

  const passwordStrength = useMemo(() => getPasswordStrength(userData?.newPassword ?? ''), [userData?.newPassword]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const updateUserField = useCallback((field: keyof AccountPageUser, value: string) => {
    setUserData((currentUser) => (currentUser ? { ...currentUser, [field]: value } : currentUser));
    setApiError(null);
    setToastMessage(null);
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
    setPasswordVisibility(emptyPasswordVisibility);
  }, []);

  const discardFormChanges = useCallback(() => {
    setUserData(initialUserData ? sanitizeUserForForm(initialUserData) : initialUserData);
    setFieldErrors({});
    setApiError(null);
    resetPasswordFields();
    showToast('Alterações descartadas.');
  }, [initialUserData, resetPasswordFields, showToast]);

  const validateAccountForm = useCallback((): boolean => {
    const nextFieldErrors: AccountFieldErrors = {};
    const isChangingPassword = Boolean(userData?.newPassword?.trim() || userData?.confirmPassword?.trim() || userData?.currentPassword?.trim());

    if (isChangingPassword && !userData?.currentPassword?.trim()) {
      nextFieldErrors.currentPassword = t('errorCurrentPasswordRequired');
    }

    if (isChangingPassword && userData?.newPassword !== userData?.confirmPassword) {
      nextFieldErrors.confirmPassword = 'As senhas não coincidem.';
    }

    if (isChangingPassword && (userData?.newPassword?.length ?? 0) < 8) {
      nextFieldErrors.confirmPassword = nextFieldErrors.confirmPassword ?? 'A nova senha precisa ter pelo menos 8 caracteres.';
    }

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length === 0;
  }, [t, userData?.confirmPassword, userData?.currentPassword, userData?.newPassword]);

  const handleSaveChanges = useCallback(async (successMessage: string) => {
    setApiError(null);

    if (!userData || !validateAccountForm()) return;

    setIsSaving(true);
    const response = await updateUser(userData);
    setIsSaving(false);

    if (!response.success) {
      setApiError(response.error);
      return;
    }

    const sanitizedUser = response.data?.user ? sanitizeUserForForm(response.data.user) : sanitizeUserForForm(userData);
    setUserData(sanitizedUser);
    setInitialUserData(sanitizedUser);
    setFieldErrors({});
    setPasswordVisibility(emptyPasswordVisibility);
    showToast(response.message || successMessage);
  }, [showToast, userData, validateAccountForm]);

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

  return (
    <FmzConnectedPageShell width="wide" className={styles.page}>
      <button type="button" onClick={() => router.back()} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" /> Voltar
      </button>

      <div className={styles.pageEyebrow}>Configurações</div>
      <div className={styles.pageHeaderRow}>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        <div className={styles.statusBadge}><span className={styles.statusDot} />Conta ativa</div>
      </div>

      <FmzFormAlert error={apiError} />

      {isLoadingUserData ? <LoadingAccountState /> : null}

      {!isLoadingUserData && !userData ? <EmptyAccountState /> : null}

      {!isLoadingUserData && userData ? (
        <>
          <SectionBlock
            icon={<UserRound className="h-[17px] w-[17px]" />}
            iconClassName={styles.bgBlue}
            title="Dados Pessoais"
            subtitle="Informações visíveis no seu perfil"
          >
            <div className={`${styles.formGrid} ${styles.grid2}`}>
              <FieldShell label={t('labelName')} required>
                <div className={styles.fieldInput}>
                  <input value={userData.name ?? ''} onChange={(event) => updateUserField('name', event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label="Contato (WhatsApp)" required>
                <div className={styles.fieldInput}>
                  <Phone className={styles.iconLeft} />
                  <input className={styles.hasIcon} type="tel" value={userData.phone ?? ''} onChange={(event) => updateUserField('phone', event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label={t('labelBirthdate')} required>
                <div className={styles.fieldInput}>
                  <Calendar className={styles.iconLeft} />
                  <input
                    className={styles.hasIcon}
                    value={userData.birthdate ?? ''}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    onChange={(event) => updateUserField('birthdate', formatBirthdateInput(event.target.value))}
                  />
                </div>
              </FieldShell>

              <FieldShell label={t('labelEmail')} required hint={<><Info />O e-mail não pode ser alterado.</>}>
                <div className={styles.fieldInput}>
                  <Mail className={styles.iconLeft} />
                  <input className={styles.hasIcon} type="email" value={userData.email ?? ''} disabled />
                  <Lock className={styles.lockIcon} />
                </div>
              </FieldShell>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={discardFormChanges}>Cancelar</button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={() => handleSaveChanges('Dados pessoais salvos!')}>
                <Check /> {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </SectionBlock>

          <SectionBlock
            icon={<MapPin className="h-[17px] w-[17px]" />}
            iconClassName={styles.bgGreen}
            title="Endereço"
            subtitle="Endereço residencial usado para cadastro e comunicações"
          >
            <div className={styles.cepGrid}>
              <FieldShell label="CEP">
                <div className={styles.fieldInput}>
                  <Search className={styles.iconLeft} />
                  <input
                    className={styles.hasIcon}
                    value={userData.postalCode ?? ''}
                    placeholder="00000-000"
                    maxLength={9}
                    onChange={(event) => updateUserField('postalCode', formatCepInput(event.target.value))}
                  />
                </div>
              </FieldShell>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => showToast('Buscando CEP...')}>
                <Search /> Buscar
              </button>
            </div>

            <div className={`${styles.formGrid} ${styles.grid2}`}>
              <FieldShell label="Logradouro" className={styles.fullField}>
                <div className={styles.fieldInput}>
                  <input value={userData.addressLine1 ?? ''} placeholder="Ex: Rua das Palmeiras" onChange={(event) => updateUserField('addressLine1', event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label="Número">
                <div className={styles.fieldInput}>
                  <input value={(userData as AccountPageUser & { addressNumber?: string }).addressNumber ?? ''} placeholder="Ex: 412" onChange={(event) => updateUserField('address' as keyof AccountPageUser, event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label="Complemento">
                <div className={styles.fieldInput}>
                  <input value={userData.addressLine2 ?? ''} placeholder="Apto, bloco, sala..." onChange={(event) => updateUserField('addressLine2', event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label="Bairro">
                <div className={styles.fieldInput}>
                  <input value={userData.district ?? ''} placeholder="Ex: Vila Madalena" onChange={(event) => updateUserField('district', event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label="Cidade">
                <div className={styles.fieldInput}>
                  <input value={userData.city ?? ''} placeholder="Ex: São Paulo" onChange={(event) => updateUserField('city', event.target.value)} />
                </div>
              </FieldShell>

              <FieldShell label="Estado">
                <div className={styles.fieldInput}>
                  <select value={userData.state ?? ''} onChange={(event) => updateUserField('state', event.target.value)}>
                    {BRAZILIAN_STATES.map((stateOption) => (
                      <option key={stateOption.value} value={stateOption.value}>{stateOption.label}</option>
                    ))}
                  </select>
                  <ChevronDown className={styles.selectIcon} />
                </div>
              </FieldShell>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={discardFormChanges}>Cancelar</button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={() => handleSaveChanges('Endereço salvo!')}>
                <Check /> {isSaving ? 'Salvando...' : 'Salvar endereço'}
              </button>
            </div>
          </SectionBlock>

          <SectionBlock
            icon={<Wallet className="h-[17px] w-[17px]" />}
            iconClassName={styles.bgGold}
            title="CPF e Número de Carteira"
            subtitle="Informações financeiras vinculadas — não podem ser alteradas"
          >
            <div className={styles.walletGrid}>
              <div className={styles.walletChip}>
                <div className={styles.walletLabel}>CPF</div>
                <div className={styles.walletValue}><Lock />{maskCpf(userData.cpf)}</div>
                <div className={styles.walletSub}>Verificado e vinculado à conta</div>
              </div>
              <div className={styles.walletChip}>
                <div className={styles.walletLabel}>Número de carteira</div>
                <div className={styles.walletValue}><Gem />{formatWalletNumber(userData)}</div>
                <div className={styles.walletSub}>{formatWalletSub(userData)}</div>
              </div>
            </div>
            <span className={styles.fieldHint}><Info />Dados gerados automaticamente no cadastro. Em caso de erro, entre em contato com o suporte.</span>
          </SectionBlock>

          <SectionBlock
            icon={<Lock className="h-[17px] w-[17px]" />}
            iconClassName={styles.bgPurple}
            title="Alterar Senha"
            subtitle="Use uma senha forte com pelo menos 8 caracteres"
          >
            <div className={`${styles.formGrid} ${styles.grid2}`}>
              <FieldShell label={t('labelCurrentPassword')} required error={fieldErrors.currentPassword} className={styles.fullField}>
                <div className={styles.fieldInput}>
                  <Lock className={styles.iconLeft} />
                  <input
                    className={styles.hasIcon}
                    type={passwordVisibility.current ? 'text' : 'password'}
                    value={userData.currentPassword ?? ''}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    onChange={(event) => updateUserField('currentPassword', event.target.value)}
                  />
                  <button type="button" className={styles.passwordToggle} onClick={() => togglePasswordVisibility('current')} aria-label="Alternar visibilidade da senha atual">
                    {passwordVisibility.current ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </FieldShell>

              <FieldShell label={t('labelNewPassword')} required>
                <div className={styles.fieldInput}>
                  <KeyRound className={styles.iconLeft} />
                  <input
                    className={styles.hasIcon}
                    type={passwordVisibility.next ? 'text' : 'password'}
                    value={userData.newPassword ?? ''}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    onChange={(event) => updateUserField('newPassword', event.target.value)}
                  />
                  <button type="button" className={styles.passwordToggle} onClick={() => togglePasswordVisibility('next')} aria-label="Alternar visibilidade da nova senha">
                    {passwordVisibility.next ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <PasswordStrengthBars strength={passwordStrength} />
              </FieldShell>

              <FieldShell label={t('labelConfirmPassword')} required error={fieldErrors.confirmPassword}>
                <div className={styles.fieldInput}>
                  <KeyRound className={styles.iconLeft} />
                  <input
                    className={styles.hasIcon}
                    type={passwordVisibility.confirmation ? 'text' : 'password'}
                    value={userData.confirmPassword ?? ''}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    onChange={(event) => updateUserField('confirmPassword', event.target.value)}
                  />
                  <button type="button" className={styles.passwordToggle} onClick={() => togglePasswordVisibility('confirmation')} aria-label="Alternar visibilidade da confirmação de senha">
                    {passwordVisibility.confirmation ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </FieldShell>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSaving} onClick={() => handleSaveChanges('Senha atualizada com sucesso!')}>
                <Lock /> {isSaving ? 'Atualizando...' : 'Atualizar senha'}
              </button>
            </div>
          </SectionBlock>

          <SectionBlock
            icon={<ShieldCheck className="h-[17px] w-[17px]" />}
            iconClassName={styles.bgGreen}
            title="Documentos e Verificação KYC"
            subtitle="Seus arquivos são protegidos com criptografia de ponta a ponta"
          >
            <div className={styles.kycAlert}>
              <span className={styles.kycAlertIcon}><Clock className="h-[18px] w-[18px]" /></span>
              <div>
                <div className={styles.kycAlertTitle}>Verificação incompleta</div>
                <div className={styles.kycAlertDesc}>2 dos 4 documentos estão pendentes. Complete o envio para liberar todas as funcionalidades da plataforma.</div>
              </div>
            </div>

            <div className={styles.docList}>
              {accountDocuments.map((document) => {
                const StatusIcon = documentStatusVisual[document.status].icon;
                const DocumentIcon = document.icon;

                return (
                  <div key={document.key} className={styles.docRow}>
                    <span className={`${styles.docIcon} ${document.toneClassName}`}><DocumentIcon className="h-[17px] w-[17px]" /></span>
                    <div className={styles.docInfo}>
                      <div className={styles.docName}>{document.name}</div>
                      <div className={styles.docMeta}>{document.meta}</div>
                    </div>
                    <div className={styles.docActions}>
                      <span className={`${styles.badge} ${documentStatusVisual[document.status].className}`}><StatusIcon />{documentStatusVisual[document.status].label}</span>
                      {document.canResend ? (
                        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => showToast('Reenviando documento...')}>
                          <RefreshCw /> Reenviar
                        </button>
                      ) : null}
                      {document.canUpload ? (
                        <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setIsUploadVisible((current) => !current)}>
                          <Upload /> Enviar
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`${styles.uploadBox} ${isUploadVisible ? styles.uploadBoxVisible : ''}`} onClick={() => showToast('Selecione um arquivo...')} role="button" tabIndex={0}>
              <UploadCloud className={styles.uploadBoxIcon} />
              <div className={styles.uploadBoxTitle}>Arraste o arquivo ou clique para selecionar</div>
              <div className={styles.uploadBoxSub}>PNG, JPG ou PDF · máx. 10 MB · mínimo 300 DPI</div>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 16 }} onClick={(event) => { event.stopPropagation(); showToast('Abrindo seletor de arquivos...'); }}>
                <FolderOpen /> Selecionar arquivo
              </button>
            </div>

            <div className={styles.divider} />

            <div className={styles.kycFooter}>
              <div>
                <div className={styles.kycFooterTitle}>Ainda faltam documentos para verificação completa</div>
                <div className={styles.kycFooterText}>Após aprovação, sua conta será totalmente liberada.</div>
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => showToast('Redirecionando para envio de documentos...')}>
                <UploadCloud /> Ir para envio de documentos
              </button>
            </div>
          </SectionBlock>
        </>
      ) : null}

      <div className={`${styles.toast} ${toastMessage ? styles.toastVisible : ''}`}>
        <CheckCircle /> <span>{toastMessage ?? 'Salvo!'}</span>
      </div>
    </FmzConnectedPageShell>
  );
}
