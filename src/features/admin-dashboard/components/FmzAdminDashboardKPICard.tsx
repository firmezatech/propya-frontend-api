'use client';

import Link from 'next/link';
import styles from './FmzAdminDashboard.module.css';

type DeltaDirection = 'up' | 'down' | 'neutral';

export type FmzAdminDashboardKPICardProps = {
  label:          string;
  value:          string;
  deltaText?:     string;
  deltaDirection?: DeltaDirection;
  iconBg:         string;
  iconColor:      string;
  icon:           React.ReactNode;
  linkHref?:      string;
  linkLabel?:     string;
};

const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const deltaCssClass: Record<DeltaDirection, string> = {
  up:      styles.kpiDeltaUp,
  down:    styles.kpiDeltaDown,
  neutral: styles.kpiDeltaNeutral,
};

export function FmzAdminDashboardKPICard({
  label,
  value,
  deltaText,
  deltaDirection = 'neutral',
  iconBg,
  iconColor,
  icon,
  linkHref,
  linkLabel,
}: FmzAdminDashboardKPICardProps) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiShimmer} aria-hidden />
      <div className={styles.kpiIcon} style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {deltaText && (
        <span className={`${styles.kpiDelta} ${deltaCssClass[deltaDirection]}`}>
          {deltaDirection === 'up' && <ArrowUpIcon />}
          {deltaDirection === 'down' && <ArrowDownIcon />}
          {deltaText}
        </span>
      )}
      {linkHref && linkLabel && (
        <Link href={linkHref} className={styles.kpiLink}>
          {linkLabel} <ArrowRightIcon />
        </Link>
      )}
    </div>
  );
}
