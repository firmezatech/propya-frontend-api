'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { InvoiceData, PropertyData, RentDetailData } from '../../../services/web3-api';
import type { FmzTenantPaymentHistoryItem } from '../../../features/tenant-portal/domain';
import { buildRenterDashboardViewModel, hasRenterDashboardData } from '../domain/fmz-renter-dashboard-view-model';
import { FmzRenterDashboardPaymentHistoryCard } from './FmzRenterDashboardPaymentHistoryCard';
import { FmzRenterDashboardRentSimulatorCard } from './FmzRenterDashboardRentSimulatorCard';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardProps = {
  propertyDetail: PropertyData;
  rentDetail: RentDetailData;
  invoiceData: InvoiceData | null;
  renterName?: string | null;
  referenceMonthLabel?: string | null;
  paymentHistory?: FmzTenantPaymentHistoryItem[];
  onPayInvoice?: (paymentUrl?: string | null) => void;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  unreadCount?: number;
};

const quickActions: QuickAction[] = [
  {
    title: 'Manutenção',
    description: 'Não há manutenções',
    href: '/connected/maintenances',
  },
  {
    title: 'Falar com proprietários',
    description: 'Você tem 1 mensagem não lida',
    href: '/connected/recordsMenu',
    unreadCount: 1,
  },
  {
    title: 'Documentação',
    description: 'Contratos e documentos do imóvel',
    href: '/connected/myContract',
  },
];

const buildLeftStyle = (percentage: number) => ({ left: `${Math.min(Math.max(percentage, 0), 100)}%` });

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.[0] ?? 'D';
  return initials.toUpperCase();
}

function FmzRenterDashboardQuickActions() {
  return (
    <section className={styles.quickGrid} aria-label="Ações rápidas da inquilina">
      {quickActions.map((action) => (
        <Link key={action.title} href={action.href} className={styles.quickCard}>
          <div className={styles.quickInfo}>
            <h3 className={styles.quickTitle}>
              {action.title}
              {action.unreadCount ? <span className={styles.quickBadge}>{action.unreadCount}</span> : null}
            </h3>
            <p className={styles.quickSub}>{action.description}</p>
          </div>
          <span className={styles.quickIconButton} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      ))}
    </section>
  );
}

export function FmzRenterDashboard({
  propertyDetail,
  rentDetail,
  invoiceData,
  renterName,
  referenceMonthLabel,
  paymentHistory = [],
  onPayInvoice,
}: FmzRenterDashboardProps) {
  const viewModel = useMemo(
    () => buildRenterDashboardViewModel({ propertyDetail, rentDetail, invoiceData, renterName, referenceMonthLabel }),
    [propertyDetail, rentDetail, invoiceData, renterName, referenceMonthLabel],
  );

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    setHasAnimated(false);
    const startTimer = window.setTimeout(() => setHasAnimated(true), 180);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [viewModel.ownershipPercentage]);

  const timelineVisualPosition = hasAnimated ? viewModel.ownershipVisualPosition : 0;
  const timelineStyle = buildLeftStyle(timelineVisualPosition);
  const initials = getInitials(viewModel.renterName);

  const handlePayInvoice = () => {
    if (onPayInvoice) {
      onPayInvoice(viewModel.invoice.paymentUrl);
      return;
    }

    if (viewModel.invoice.paymentUrl) {
      window.open(viewModel.invoice.paymentUrl, '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
    }
  };

  return (
    <main className={styles.dashboard} aria-label="Dashboard da inquilina">
      <section className={styles.greeting}>
        <h1 className={styles.greetingTitle}>Olá, {viewModel.renterName}!</h1>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}><span className={styles.eyebrowDot} />Sua jornada de compra</div>
            <div className={styles.heroTitleRow}>
              <h2 className={styles.heroTitle}>Você já é dona de <em>{viewModel.ownershipPercentageLabel}</em> da sua casa</h2>
              <div className={styles.heroAvatar}>{initials.slice(0, 1)}</div>
            </div>
            <p className={styles.heroDescription}>Se mantiver seu ritmo atual de compra, você pode atingir {viewModel.nextMilestoneLabel} do imóvel em breve.</p>

            <div className={styles.timelineWrap}>
              <div className={styles.timelineLabel} style={timelineStyle}>{viewModel.ownershipPercentageLabel} — você</div>
              <div className={styles.timelineTrack}>
                <div className={styles.timelineFill} style={{ width: hasAnimated ? `${viewModel.ownershipVisualPosition}%` : '0%' }} />
                <div className={styles.timelineHouse} style={timelineStyle}>🏡</div>
              </div>
              <div className={styles.timelinePoints}>
                {viewModel.journeyMilestones.map((milestone) => {
                  const isDone = milestone.status === 'done';
                  const isNext = milestone.status === 'next';
                  const isFinal = milestone.percentage === 100;

                  return (
                    <div
                      key={milestone.percentage}
                      className={`${styles.timelinePoint} ${isDone ? styles.timelinePointDone : ''} ${isNext ? styles.timelinePointNext : ''}`}
                      style={buildLeftStyle(milestone.visualPosition)}
                    >
                      <span className={`${styles.timelineDot} ${isDone ? styles.timelineDotDone : ''} ${isNext ? styles.timelineDotNext : styles.timelineDotFuture}`} />
                      <span className={styles.timelinePointLabel}>{milestone.label}{isNext ? ' 🎯' : isFinal ? ' 🏠' : ''}</span>
                      <span className={styles.timelinePointCaption}>{milestone.caption}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className={styles.ctaPanel}>
            <div className={styles.ctaAvatar}>{initials.slice(0, 1)}</div>
            <div className={styles.ctaContent}>
              <div className={styles.ctaKicker}><span className={styles.ctaKickerDot} />Próximo marco</div>
              <h3 className={styles.ctaTitle}>Faltam {viewModel.nextMilestoneRemainingLabel} para chegar em {viewModel.nextMilestoneLabel}</h3>
              <Link href="/connected/tokensToPurchasePix" className={styles.buyCtaButton}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Comprar mais tokens
              </Link>
              <div className={styles.ctaSmall}>Cada compra aproxima você da propriedade total.</div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Resumo do mês</h3>
          <p className={styles.cardSub}>Competência: {viewModel.referenceMonthLabel}</p>
          <div className={styles.billTotal}>{viewModel.invoice.totalLabel}</div>
          <div className={styles.billDue}>
            <span className={styles.billDuePill}>Vencimento →</span>
            <strong>{viewModel.invoice.dueDateLabel}</strong>
          </div>
          <div className={styles.billLines}>
            {viewModel.invoice.lines.map((line, index) => (
              <div key={line.key}>
                {index === 3 ? <div className={styles.billSeparator} /> : null}
                <div className={styles.billLine}>
                  <span className={`${styles.billLabel} ${line.tone === 'warning' ? styles.billLabelHighlight : ''}`}>{line.label}</span>
                  <span className={`${styles.billValue} ${line.tone === 'success' ? styles.billValueSuccess : ''} ${line.tone === 'warning' ? styles.billValueWarning : ''}`}>{line.value}</span>
                </div>
              </div>
            ))}
            <div className={styles.billSeparator} />
            <div className={`${styles.billLine} ${styles.billTotalLine}`}>
              <span className={styles.billTotalLabel}>Total</span>
              <span className={styles.billTotalValue}>{viewModel.invoice.totalLabel}</span>
            </div>
          </div>
          <button type="button" className={styles.boletoButton} onClick={handlePayInvoice}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 7h12" stroke="currentColor" strokeWidth="1.3" /><path d="M5 10h2M9 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            Pagar boleto
          </button>
        </div>

        <div className={styles.insightStack}>
          <FmzRenterDashboardRentSimulatorCard viewModel={viewModel} hasAnimated={hasAnimated} />
          <FmzRenterDashboardPaymentHistoryCard items={paymentHistory} />
        </div>
      </section>

      <FmzRenterDashboardQuickActions />
    </main>
  );
}

export { hasRenterDashboardData };
