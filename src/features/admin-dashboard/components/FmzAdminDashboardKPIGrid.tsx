'use client';

import styles from './FmzAdminDashboard.module.css';
import { FmzAdminDashboardKPICard } from './FmzAdminDashboardKPICard';
import type { FmzAdminDashboardMetrics } from '../domain/fmz-admin-dashboard.types';

type Props = {
  metrics: FmzAdminDashboardMetrics | null;
  loading: boolean;
};

const formatInvoiceVolume = (brl: string): string => {
  const value = parseFloat(brl);
  if (!Number.isFinite(value)) return 'R$ 0';
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${value.toFixed(2)}`;
};

const deltaDirection = (previous: number, current: number) => {
  if (current > previous) return 'up' as const;
  if (current < previous) return 'down' as const;
  return 'neutral' as const;
};

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TokensIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const InvoicesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="7" y1="14" x2="9" y2="14" />
    <line x1="12" y1="14" x2="15" y2="14" />
  </svg>
);

const PropertiesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SkeletonCard = () => (
  <div className={styles.kpiCard}>
    <div className={styles.kpiShimmer} aria-hidden />
    <div className={styles.skeleton} style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 14 }} />
    <div className={styles.skeleton} style={{ width: '60%', height: 11, borderRadius: 4, marginBottom: 8 }} />
    <div className={styles.skeleton} style={{ width: '40%', height: 28, borderRadius: 4, marginBottom: 8 }} />
    <div className={styles.skeleton} style={{ width: '50%', height: 20, borderRadius: 4 }} />
  </div>
);

export function FmzAdminDashboardKPIGrid({ metrics, loading }: Props) {
  if (loading || !metrics) {
    return (
      <div className={styles.kpiGrid}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const usersDelta    = deltaDirection(metrics.users.lastMonth, metrics.users.thisMonth);
  const tokensDelta   = deltaDirection(metrics.tokens.lastMonth, metrics.tokens.thisMonth);
  const invoicesDelta = deltaDirection(
    parseFloat(metrics.invoices.volumeLastMonthBrl),
    parseFloat(metrics.invoices.volumeThisMonthBrl),
  );

  return (
    <div className={styles.kpiGrid}>
      <FmzAdminDashboardKPICard
        label="Usuários cadastrados"
        value={metrics.users.total.toLocaleString('pt-BR')}
        deltaText={`${metrics.users.thisMonth > 0 ? '+' : ''}${metrics.users.thisMonth} este mês`}
        deltaDirection={usersDelta}
        iconBg="#EFF6FF"
        iconColor="#2563EB"
        icon={<UsersIcon />}
        linkHref="/connected/admin-user-list"
        linkLabel="Ver todos"
      />
      <FmzAdminDashboardKPICard
        label="Tokens transacionados"
        value={`${metrics.tokens.volumeTotal.toLocaleString('pt-BR')} ${metrics.tokens.unit}`}
        deltaText={`${metrics.tokens.thisMonth > 0 ? '+' : ''}${metrics.tokens.thisMonth.toLocaleString('pt-BR')} este mês`}
        deltaDirection={tokensDelta}
        iconBg="#F0FAF5"
        iconColor="#1A8C5B"
        icon={<TokensIcon />}
        linkHref="/connected/admin-token-orders"
        linkLabel="Ver histórico"
      />
      <FmzAdminDashboardKPICard
        label="Volume de boletos (mês)"
        value={formatInvoiceVolume(metrics.invoices.volumeThisMonthBrl)}
        deltaText={`${metrics.invoices.percentageChangeVsLastMonth >= 0 ? '+' : ''}${metrics.invoices.percentageChangeVsLastMonth}% vs. mês anterior`}
        deltaDirection={invoicesDelta}
        iconBg="#FBF3DA"
        iconColor="#C8A020"
        icon={<InvoicesIcon />}
        linkHref="/connected/admin-rent-charges"
        linkLabel="Ver boletos"
      />
      <FmzAdminDashboardKPICard
        label="Imóveis na plataforma"
        value={metrics.properties.total.toLocaleString('pt-BR')}
        deltaText={`${metrics.properties.available} com vaga`}
        deltaDirection="neutral"
        iconBg="#F5F3FF"
        iconColor="#7C3AED"
        icon={<PropertiesIcon />}
        linkHref="/connected/property-management"
        linkLabel="Gerenciar"
      />
    </div>
  );
}
