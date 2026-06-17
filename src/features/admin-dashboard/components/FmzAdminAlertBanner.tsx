'use client';

import { useRouter } from 'next/navigation';
import styles from './FmzAdminDashboard.module.css';

type Props = {
  pendingCount: number;
  href: string;
};

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const boletoLabel = (count: number) =>
  count === 1 ? '1 boleto aguardando sua validação' : `${count} boletos aguardando sua validação`;

export function FmzAdminAlertBanner({ pendingCount, href }: Props) {
  const router = useRouter();

  if (pendingCount <= 0) return null;

  return (
    <div className={styles.alertBanner} role="alert">
      <div className={styles.alertIcon} aria-hidden>
        <WarningIcon />
      </div>
      <div className={styles.alertBody}>
        <div className={styles.alertTitle}>{boletoLabel(pendingCount)}</div>
        <div className={styles.alertSubtitle}>
          Alguns boletos estão pendentes há mais de 24h — revise e valide para evitar atrasos nos repasses.
        </div>
      </div>
      <button
        type="button"
        className={styles.alertCta}
        onClick={() => router.push(href)}
        aria-label={`Revisar ${boletoLabel(pendingCount)}`}
      >
        Revisar agora <ArrowRightIcon />
      </button>
    </div>
  );
}
