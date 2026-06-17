'use client';

import Link from 'next/link';
import styles from './FmzAdminDashboard.module.css';

type QuickAccessEntry = {
  href:      string;
  iconBg:    string;
  iconColor: string;
  icon:      React.ReactNode;
  label:     string;
  subtitle:  string;
};

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const TokenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const RefundIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-3.34" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

const QUICK_ACCESS_ENTRIES: QuickAccessEntry[] = [
  {
    href:      '/connected/admin-emails',
    iconBg:    '#EFF6FF',
    iconColor: '#2563EB',
    icon:      <EmailIcon />,
    label:     'Enviar e-mail',
    subtitle:  'Templates prontos',
  },
  {
    href:      '/connected/admin-notifications',
    iconBg:    '#FFFBEB',
    iconColor: '#D97706',
    icon:      <BellIcon />,
    label:     'Notificações',
    subtitle:  'Enviar avisos',
  },
  {
    href:      '/connected/admin-token-orders',
    iconBg:    '#F0FAF5',
    iconColor: '#1A8C5B',
    icon:      <TokenIcon />,
    label:     'Compras de tokens',
    subtitle:  'Histórico de ordens',
  },
  {
    href:      '/connected/admin-kyc',
    iconBg:    '#F5F3FF',
    iconColor: '#7C3AED',
    icon:      <FileIcon />,
    label:     'KYC pendente',
    subtitle:  'Revisão de identidade',
  },
  {
    href:      '/connected/admin-token-orders?status=refund_pending',
    iconBg:    '#FEF5F4',
    iconColor: '#D94F3D',
    icon:      <RefundIcon />,
    label:     'Estornos',
    subtitle:  'Pedidos em andamento',
  },
  {
    href:      '/connected/platform-settings',
    iconBg:    '#F0F1F5',
    iconColor: '#5A6478',
    icon:      <SettingsIcon />,
    label:     'Configurações',
    subtitle:  'Plataforma',
  },
];

export function FmzAdminQuickAccessGrid() {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Acesso rápido</span>
      </div>
      <div className={styles.quickAccessGrid}>
        {QUICK_ACCESS_ENTRIES.map((entry) => (
          <Link key={entry.href} href={entry.href} className={styles.quickAccessItem}>
            <div
              className={styles.quickAccessIcon}
              style={{ background: entry.iconBg, color: entry.iconColor }}
              aria-hidden
            >
              {entry.icon}
            </div>
            <span className={styles.quickAccessLabel}>{entry.label}</span>
            <span className={styles.quickAccessSub}>{entry.subtitle}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
