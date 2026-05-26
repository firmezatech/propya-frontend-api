import { AlertTriangle, Check, Clock, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import styles from './FmzAccountPage.module.css';
import type { TenantProfileCompletion, TenantKycStatus } from '../../tenant-portal/domain/fmz-tenant-profile.types';

// ─── Props ────────────────────────────────────────────────────────────────────

type AccountKycProgressBannerProps = {
  completion: TenantProfileCompletion;
  kycStatus: TenantKycStatus;
};

// ─── KYC chip type — derived from backend statuses ────────────────────────────

type KycChipStatus = 'ok' | 'review' | 'pending' | 'error';

type KycChip = {
  label: string;
  status: KycChipStatus;
};

const chipStatusClass: Record<KycChipStatus, string> = {
  ok: 'chipOk',
  review: 'chipReview',
  pending: 'chipPending',
  error: 'chipPending', // reuses warning style; distinct icon signals rejection
};

function ChipIcon({ status }: { status: KycChipStatus }) {
  if (status === 'ok') return <Check aria-hidden="true" />;
  if (status === 'review') return <Clock aria-hidden="true" />;
  if (status === 'error') return <AlertTriangle aria-hidden="true" />;
  return <AlertCircle aria-hidden="true" />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds KYC chips from backend-provided document lists.
 * Mapping rules (backend-owned, frontend only renders):
 *   verifiedDocuments           → ok     (green, check icon)
 *   underReviewDocuments        → review (blue, clock icon)
 *   pendingDocuments            → pending (yellow/warn, circle icon)
 *   missingDocuments            → pending (same as pending — not yet submitted)
 *   rejectedDocuments           → error  (red/warn, triangle icon)
 *   needsResubmissionDocuments  → error  (same — user action required)
 */
function buildKycChipsFromCompletion(completion: TenantProfileCompletion): KycChip[] {
  const chips: KycChip[] = [];

  completion.verifiedDocuments.forEach((key) => {
    chips.push({ label: humanizeDocumentKey(key), status: 'ok' });
  });

  (completion.underReviewDocuments ?? []).forEach((key) => {
    chips.push({ label: humanizeDocumentKey(key), status: 'review' });
  });

  completion.pendingDocuments.forEach((key) => {
    chips.push({ label: humanizeDocumentKey(key), status: 'pending' });
  });

  completion.missingDocuments.forEach((key) => {
    chips.push({ label: humanizeDocumentKey(key), status: 'pending' });
  });

  (completion.rejectedDocuments ?? []).forEach((key) => {
    chips.push({ label: humanizeDocumentKey(key), status: 'error' });
  });

  (completion.needsResubmissionDocuments ?? []).forEach((key) => {
    chips.push({ label: humanizeDocumentKey(key), status: 'error' });
  });

  return chips;
}

/**
 * Converts backend requirement keys to human-readable Portuguese labels.
 * Falls back to the key itself for unknown keys — never hides data.
 */
function humanizeDocumentKey(key: string): string {
  const DOCUMENT_LABELS: Record<string, string> = {
    identity_document: 'Documento de identidade',
    selfie_with_document: 'Selfie com documento',
    proof_of_address: 'Comprovante de residência',
    income_tax_document: 'Declaração de IR',
  };
  return DOCUMENT_LABELS[key] ?? key;
}

function buildBannerLabel(
  completion: TenantProfileCompletion,
  kycStatus: TenantKycStatus,
): string {
  if (kycStatus === 'verified' && completion.percentage >= 100) {
    return 'Cadastro completo e verificado';
  }

  const rejectedCount = (completion.rejectedDocuments?.length ?? 0) + (completion.needsResubmissionDocuments?.length ?? 0);
  if (rejectedCount > 0) {
    return rejectedCount === 1
      ? 'Cadastro com 1 documento rejeitado — reenvio necessário'
      : `Cadastro com ${rejectedCount} documentos rejeitados — reenvio necessário`;
  }

  const missingCount = completion.missingDocuments.length;
  const pendingCount = completion.pendingDocuments.length;
  const totalPending = missingCount + pendingCount;

  if (totalPending === 0) return 'Aguardando verificação final';
  if (totalPending === 1) return 'Cadastro incompleto — 1 documento pendente';
  return `Cadastro incompleto — ${totalPending} documentos pendentes`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccountKycProgressBanner({ completion, kycStatus }: AccountKycProgressBannerProps) {
  const isComplete = kycStatus === 'verified' && completion.percentage >= 100;
  const chips = buildKycChipsFromCompletion(completion);
  const bannerLabel = buildBannerLabel(completion, kycStatus);

  return (
    <div className={styles.kycBanner}>
      <div className={styles.kycBannerTop}>
        <div className={styles.kycBannerLabel}>
          <span className={styles.kycLblIco}>
            {isComplete
              ? <CheckCircle aria-hidden="true" />
              : <AlertTriangle aria-hidden="true" />}
          </span>
          {bannerLabel}
        </div>
        <div className={styles.kycBannerPct}>
          <span className={styles.kycBannerPctValue}>{completion.percentage}%</span>
          <span className={styles.kycBannerPctSub}>concluído</span>
        </div>
      </div>

      <div className={styles.kycProgressTrack}>
        <div className={styles.kycProgressFill} style={{ width: `${completion.percentage}%` }} />
      </div>

      {chips.length > 0 ? (
        <div className={styles.kycChips}>
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`${styles.kycChip} ${styles[chipStatusClass[chip.status] as keyof typeof styles]}`}
            >
              <ChipIcon status={chip.status} />
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}

      {completion.missingFields.length > 0 ? (
        <div className={styles.kycChips} style={{ marginTop: '6px' }}>
          {completion.missingFields.map((field) => (
            <span
              key={field}
              className={`${styles.kycChip} ${styles.chipPending}`}
            >
              <AlertCircle aria-hidden="true" />
              {humanizeFieldKey(field)}
            </span>
          ))}
        </div>
      ) : null}

      {isComplete ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--fmz-success)', fontSize: 12.5, fontWeight: 600 }}>
          <ShieldCheck aria-hidden="true" style={{ width: 14, height: 14 }} />
          Identidade verificada com sucesso
        </div>
      ) : null}
    </div>
  );
}

function humanizeFieldKey(field: string): string {
  const FIELD_LABELS: Record<string, string> = {
    birthdate: 'Data de nascimento',
    postal_code: 'CEP',
    phone: 'Telefone',
    address_line1: 'Endereço',
    city: 'Cidade',
    state: 'Estado',
  };
  return FIELD_LABELS[field] ?? field;
}
