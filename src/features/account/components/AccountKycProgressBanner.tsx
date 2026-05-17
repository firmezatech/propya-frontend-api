import { AlertTriangle, AlertCircle, Check, Clock } from 'lucide-react';
import styles from './FmzAccountPage.module.css';

type KycChip = {
  label: string;
  status: 'ok' | 'review' | 'pending';
};

const KYC_CHIPS: KycChip[] = [
  { label: 'RG / CNH aprovado', status: 'ok' },
  { label: 'Selfie aprovada', status: 'ok' },
  { label: 'Comprovante em análise', status: 'review' },
  { label: 'IR pendente', status: 'pending' },
];

const chipStatusClass: Record<KycChip['status'], string> = {
  ok: 'chipOk',
  review: 'chipReview',
  pending: 'chipPending',
};

const ChipIcon = ({ status }: { status: KycChip['status'] }) => {
  if (status === 'ok') return <Check aria-hidden="true" />;
  if (status === 'review') return <Clock aria-hidden="true" />;
  return <AlertCircle aria-hidden="true" />;
};

const pendingCount = KYC_CHIPS.filter((c) => c.status !== 'ok').length;
const totalCount = KYC_CHIPS.length;
const progressPercent = Math.round(((totalCount - pendingCount) / totalCount) * 100);

export function AccountKycProgressBanner() {
  return (
    <div className={styles.kycBanner}>
      <div className={styles.kycBannerTop}>
        <div className={styles.kycBannerLabel}>
          <AlertTriangle aria-hidden="true" />
          Cadastro incompleto — {pendingCount} documentos pendentes
        </div>
        <span className={styles.kycBannerPct}>{progressPercent}% concluído</span>
      </div>
      <div className={styles.kycProgressTrack}>
        <div className={styles.kycProgressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.kycChips}>
        {KYC_CHIPS.map((chip) => (
          <span key={chip.label} className={`${styles.kycChip} ${styles[chipStatusClass[chip.status] as keyof typeof styles]}`}>
            <ChipIcon status={chip.status} />
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}
