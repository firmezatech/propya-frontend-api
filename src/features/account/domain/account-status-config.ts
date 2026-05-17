import { AlertCircle, Camera, CheckCircle, Clock, FileText, FileX, IdCard, UserRound, MapPin, Wallet, Lock, ShieldCheck } from 'lucide-react';
import type { AccountDocument, AccountDocumentStatus, AccountSidebarItem } from './account-page.types';

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

type DocumentStatusVisual = {
  label: string;
  badgeClass: string;
  rowClass: string;
  iconClass: string;
  icon: typeof CheckCircle;
};

export const DOCUMENT_STATUS_VISUAL: Record<AccountDocumentStatus, DocumentStatusVisual> = {
  approved: {
    label: 'Aprovado',
    badgeClass: 'badgeGreen',
    rowClass: 'docRowOk',
    iconClass: 'docIconOk',
    icon: CheckCircle,
  },
  review: {
    label: 'Em análise',
    badgeClass: 'badgeOrange',
    rowClass: 'docRowRev',
    iconClass: 'docIconRev',
    icon: Clock,
  },
  pending: {
    label: 'Pendente',
    badgeClass: 'badgeRed',
    rowClass: 'docRowPnd',
    iconClass: 'docIconPnd',
    icon: AlertCircle,
  },
};

export const ACCOUNT_DOCUMENTS: AccountDocument[] = [
  {
    key: 'identity-document',
    name: 'RG ou CNH (frente e verso)',
    meta: 'Documento de identificação enviado para verificação',
    status: 'approved',
    icon: IdCard,
    toneClassName: 'bgGreen',
  },
  {
    key: 'selfie-document',
    name: 'Selfie segurando o documento',
    meta: 'Selfie enviada para validação de identidade',
    status: 'approved',
    icon: Camera,
    toneClassName: 'bgGreen',
  },
  {
    key: 'proof-of-address',
    name: 'Comprovante de residência',
    meta: 'Em análise pela equipe — pode levar até 48h',
    status: 'review',
    icon: FileText,
    toneClassName: 'bgOrange',
    canResend: true,
  },
  {
    key: 'income-tax-document',
    name: 'Declaração de Imposto de Renda',
    meta: 'Não enviado · Necessário para transações acima de R$ 5.000/mês',
    status: 'pending',
    icon: FileX,
    toneClassName: 'bgRed',
    canUpload: true,
  },
];

export const SIDEBAR_ITEMS: AccountSidebarItem[] = [
  { id: 'sec-dados', label: 'Dados pessoais', icon: UserRound },
  { id: 'sec-endereco', label: 'Endereço', icon: MapPin },
  { id: 'sec-financeiro', label: 'CPF e Carteira', icon: Wallet },
  { id: 'sec-senha', label: 'Alterar senha', icon: Lock },
  { id: 'sec-kyc', label: 'Documentos KYC', icon: ShieldCheck, hasDot: true },
];

export const SECTION_IDS = SIDEBAR_ITEMS.map((item) => item.id);
