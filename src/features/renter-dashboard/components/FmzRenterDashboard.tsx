'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { InvoiceData, PropertyData, RentDetailData } from '../../../services/web3-api';
import { buildRenterDashboardViewModel, hasRenterDashboardData } from '../domain/fmz-renter-dashboard-view-model';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardProps = {
  propertyDetail: PropertyData;
  rentDetail: RentDetailData;
  invoiceData: InvoiceData | null;
  renterName?: string | null;
  referenceMonthLabel?: string | null;
  onPayInvoice?: (paymentUrl?: string | null) => void;
};

const buildLeftStyle = (percentage: number) => ({ left: `${Math.min(Math.max(percentage, 0), 100)}%` });

export function FmzRenterDashboard({
  propertyDetail,
  rentDetail,
  invoiceData,
  renterName,
  referenceMonthLabel,
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
        <div className={styles.greetingTag}>📅 {viewModel.referenceMonthLabel}</div>
        <h1 className={styles.greetingTitle}>Olá, {viewModel.renterName}!</h1>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.heroEyebrow}><span className={styles.eyebrowDot} />Sua jornada de compra</div>
            <h2 className={styles.heroTitle}>Você já conquistou <em>{viewModel.ownershipPercentageLabel}</em> da sua casa!</h2>
            <p className={styles.heroDescription}>Se mantiver seu ritmo atual de compra, você pode atingir {viewModel.nextMilestoneLabel} do imóvel em breve. Cada token comprado aproxima você da propriedade total.</p>

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
            <div className={styles.ctaContent}>
              <div className={styles.ctaKicker}>🎯 próximo marco</div>
              <h3 className={styles.ctaTitle}>Faltam {viewModel.nextMilestoneRemainingLabel} para chegar em {viewModel.nextMilestoneLabel}</h3>
              <Link href="/connected/tokensToPurchasePix" className={styles.primaryButton}>
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
          <div className={styles.billDue}>Vencimento: <strong>{viewModel.invoice.dueDateLabel}</strong></div>
          <div className={styles.billLines}>
            {viewModel.invoice.lines.map((line, index) => (
              <div key={line.key}>
                {index === 3 ? <div className={styles.billSeparator} /> : null}
                <div className={styles.billLine}>
                  <span className={styles.billLabel}>{line.label}</span>
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
          <button type="button" className={styles.primaryButton} onClick={handlePayInvoice}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 7h12" stroke="currentColor" strokeWidth="1.3" /><path d="M5 10h2M9 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            Pagar boleto
          </button>
          <div className={styles.billLinks}>
            <Link href="/connected/myContract" className={styles.secondaryLink}>Ver meu contrato →</Link>
            <Link href="/connected/paymentHistory" className={styles.secondaryLink}>Ver histórico de pagamentos →</Link>
          </div>
        </div>

        <div className={styles.insightStack}>
          <div className={`${styles.card} ${styles.rentCard}`}>
            <div>
              <div className={styles.rentTitle}>↗ Seu aluguel caiu</div>
              <div className={styles.rentCompare}>
                <div className={styles.rentCurrent}>{viewModel.currentRentLabel}</div>
                <div className={styles.rentOriginal}>{viewModel.originalRentLabel}</div>
              </div>
              <p className={styles.rentCopy}>{viewModel.rentCopy}</p>
              <div className={styles.savingsPill}>Você economiza {viewModel.yearlySavingsLabel}/ano</div>
            </div>
            <div>
              <div className={styles.barTrack}><div className={styles.barFill} style={{ width: hasAnimated ? `${viewModel.rentPaidPercentage}%` : '0%' }} /></div>
              <div className={styles.barLabels}>
                <span className={`${styles.barLabel} ${styles.barLabelSuccess}`}>Atual: {viewModel.currentRentLabel}</span>
                <span className={styles.barLabel}>Original: {viewModel.originalRentLabel}</span>
              </div>
              <Link href="/connected/tokensToPurchasePix" className={styles.rentActionButton}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Comprar mais tokens
              </Link>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>O próximo passo é simples</h3>
            <p className={styles.cardSub}>Você está a {viewModel.nextMilestoneProgressPercentage.toFixed(1).replace('.', ',')}% do objetivo de {viewModel.nextMilestoneLabel}. Uma nova compra de tokens acelera essa conquista.</p>
            <div className={styles.barTrack}><div className={`${styles.barFill} ${styles.barFillGold}`} style={{ width: hasAnimated ? `${viewModel.nextMilestoneProgressPercentage}%` : '0%' }} /></div>
            <div className={styles.barLabels}>
              <span className={styles.barLabel}>{viewModel.acquiredTokensLabel} até {viewModel.nextMilestoneLabel}</span>
              <span className={`${styles.barLabel} ${styles.barLabelSuccess}`}>{viewModel.nextMilestoneProgressPercentage.toFixed(1).replace('.', ',')}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.quickGrid} aria-label="Ações rápidas da inquilina">
        {viewModel.quickActions.map((action) => (
          <Link key={action.key} href={action.href} className={styles.quickCard}>
            <span className={styles.quickInfo}>
              <span className={styles.quickTitle}>
                {action.title}
                {action.badge ? <span className={styles.quickBadge}>{action.badge}</span> : null}
              </span>
              <span className={styles.quickSub}>{action.subtitle}</span>
            </span>
            <span className={styles.quickIconButton} aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

export { hasRenterDashboardData };
