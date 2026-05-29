import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileX,
  IdCard,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import type { AccountSidebarItem } from './fmz-account-page.types';
import type { TenantKycDocumentStatus } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── Brazilian States ──────────────────────────────────────────────────────────

export const BRAZILIAN_STATES = [
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

// ─── KYC Document Status Visual ───────────────────────────────────────────────
// Maps every backend KYC status to UI presentation tokens.
// These are purely visual — no business logic here.

type KycDocumentStatusVisual = {
  label: string;
  badgeClass: string;
  rowClass: string;
  iconClass: string;
  icon: typeof CheckCircle;
  canUpload: boolean;    // whether the upload button should be shown
  canResubmit: boolean;  // whether the resubmit button should be shown
};

export const KYC_DOCUMENT_STATUS_VISUAL: Record<TenantKycDocumentStatus, KycDocumentStatusVisual> = {
  verified: {
    label: 'Verificado',
    badgeClass: 'badgeGreen',
    rowClass: 'docRowOk',
    iconClass: 'docIconOk',
    icon: CheckCircle,
    canUpload: false,
    canResubmit: false,
  },
  under_review: {
    label: 'Em análise',
    badgeClass: 'badgeOrange',
    rowClass: 'docRowRev',
    iconClass: 'docIconRev',
    icon: Clock,
    canUpload: false,
    canResubmit: false,
  },
  pending: {
    label: 'Pendente',
    badgeClass: 'badgeRed',
    rowClass: 'docRowPnd',
    iconClass: 'docIconPnd',
    icon: AlertCircle,
    canUpload: true,
    canResubmit: false,
  },
  rejected: {
    label: 'Rejeitado',
    badgeClass: 'badgeRed',
    rowClass: 'docRowPnd',
    iconClass: 'docIconPnd',
    icon: XCircle,
    canUpload: false,
    canResubmit: true,
  },
  needs_resubmission: {
    label: 'Reenviar documento',
    badgeClass: 'badgeOrange',
    rowClass: 'docRowRev',
    iconClass: 'docIconRev',
    icon: RefreshCw,
    canUpload: false,
    canResubmit: true,
  },
};

/**
 * Returns the visual config for a KYC document status.
 * Falls back to the `pending` style if the backend returns an unknown status.
 * This fallback is purely for rendering safety — no business logic inferred.
 */
export function resolveKycDocumentStatusVisual(
  status: string,
): KycDocumentStatusVisual {
  return KYC_DOCUMENT_STATUS_VISUAL[status as TenantKycDocumentStatus]
    ?? KYC_DOCUMENT_STATUS_VISUAL.pending;
}

/**
 * Returns the icon component associated with a document requirement key.
 * Falls back to IdCard for unknown keys.
 * Icon choice is purely presentational — the label and description
 * come from the backend.
 */
export function resolveKycDocumentIcon(requirementKey: string): typeof IdCard {
  if (requirementKey.includes('identity') || requirementKey.includes('rg') || requirementKey.includes('cnh')) return IdCard;
  if (requirementKey.includes('selfie') || requirementKey.includes('camera')) return UserRound;
  if (requirementKey.includes('address') || requirementKey.includes('residencia') || requirementKey.includes('comprovante')) return MapPin;
  if (requirementKey.includes('income') || requirementKey.includes('imposto') || requirementKey.includes('ir')) return FileX;
  return IdCard;
}

// ─── Sidebar Items ─────────────────────────────────────────────────────────────
// Static — sidebar structure is a UX concern, not a backend concern.

export const SIDEBAR_ITEMS: AccountSidebarItem[] = [
  { id: 'sec-dados', label: 'Dados pessoais', icon: UserRound },
  { id: 'sec-endereco', label: 'Endereço', icon: MapPin },
  { id: 'sec-financeiro', label: 'CPF e Carteira', icon: Wallet },
  { id: 'sec-senha', label: 'Alterar senha', icon: Lock },
  { id: 'sec-kyc', label: 'Documentos KYC', icon: ShieldCheck },
];

export const SECTION_IDS = SIDEBAR_ITEMS.map((item) => item.id);
