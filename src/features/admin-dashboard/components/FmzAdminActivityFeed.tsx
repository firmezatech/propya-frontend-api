'use client';

import styles from './FmzAdminDashboard.module.css';
import type { FmzAdminActivityEvent, FmzActivityEventType } from '../domain/fmz-admin-dashboard.types';

// ─── Relative timestamp ────────────────────────────────────────────────────────

const relativeTime = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (isNaN(diffMs) || diffMs < 0) return '';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1)  return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1)   return 'ontem';
  return `há ${days} dias`;
};

// ─── Event type → icon config ──────────────────────────────────────────────────

type IconConfig = {
  bg:    string;
  color: string;
  icon:  React.ReactNode;
};

const TokenPurchaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const UserSignupIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const InvoiceGeneratedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const RefundApprovedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-3.34" />
  </svg>
);

const PropertyAddedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const EVENT_ICON_CONFIG: Record<FmzActivityEventType, IconConfig> = {
  token_purchase:    { bg: '#F0FAF5', color: '#1A8C5B', icon: <TokenPurchaseIcon /> },
  user_signup:       { bg: '#EFF6FF', color: '#2563EB', icon: <UserSignupIcon /> },
  invoice_generated: { bg: '#FBF3DA', color: '#C8A020', icon: <InvoiceGeneratedIcon /> },
  refund_approved:   { bg: '#FEF5F4', color: '#D94F3D', icon: <RefundApprovedIcon /> },
  property_added:    { bg: '#F5F3FF', color: '#7C3AED', icon: <PropertyAddedIcon /> },
};

// ─── Component ─────────────────────────────────────────────────────────────────

type Props = {
  events:  FmzAdminActivityEvent[];
  loading: boolean;
};

const SkeletonRow = () => (
  <div className={styles.activityRow}>
    <div className={styles.skeleton} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
    <div className={styles.activityBody}>
      <div className={styles.skeleton} style={{ width: '75%', height: 13, borderRadius: 4, marginBottom: 5 }} />
      <div className={styles.skeleton} style={{ width: '30%', height: 11, borderRadius: 4 }} />
    </div>
  </div>
);

export function FmzAdminActivityFeed({ events, loading }: Props) {
  if (loading) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Atividade recente</span>
        </div>
        {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Atividade recente</span>
      </div>
      {events.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--dash-hint)', fontSize: 13 }}>
          Nenhuma atividade registrada ainda.
        </div>
      ) : (
        events.map((event) => {
          const config = EVENT_ICON_CONFIG[event.eventType] ?? EVENT_ICON_CONFIG.token_purchase;
          return (
            <div key={event.id} className={styles.activityRow}>
              <div
                className={styles.activityIcon}
                style={{ background: config.bg, color: config.color }}
                aria-hidden
              >
                {config.icon}
              </div>
              <div className={styles.activityBody}>
                <div className={styles.activityText}>{event.title}</div>
                <div className={styles.activityTime}>{relativeTime(event.createdAt)}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
