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

const CIRCLE_RADIUS = 90;
const CIRCLE_CENTER = 120;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const HALF_CIRCLE = CIRCLE_CIRCUMFERENCE / 2;
const buildLeftStyle = (percentage: number) => ({ left: `${Math.min(Math.max(percentage, 0), 100)}%` });

function getGaugePoint(percentage: number) {
  const normalized = Math.min(Math.max(percentage, 0), 100);
  const angleDeg = 180 + (normalized / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    x: CIRCLE_CENTER + CIRCLE_RADIUS * Math.cos(angleRad),
    y: CIRCLE_CENTER + CIRCLE_RADIUS * Math.sin(angleRad),
  };
}

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

  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const startTimer = window.setTimeout(() => setHasAnimated(true), 180);
    const step = Math.max(viewModel.ownershipPercentage / 60, 0.1);
    const counter = window.setInterval(() => {
      setAnimatedPercentage((current) => {
        const next = Math.min(current + step, viewModel.ownershipPercentage);
        if (next >= viewModel.ownershipPercentage) window.clearInterval(counter);
        return next;
      });
    }, 24);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(counter);
    };
  }, [viewModel.ownershipPercentage]);

  const filledArc = (viewModel.ownershipPercentage / 100) * HALF_CIRCLE;
  const gaugePoint = getGaugePoint(hasAnimated ? viewModel.ownershipPercentage : 0);
  const nextMilestonePoint = getGaugePoint(viewModel.nextMilestonePercentage);
  const timelineStyle = buildLeftStyle(hasAnimated ? viewModel.ownershipPercentage : 0);

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
        <h1 className={styles.greetingTitle}>Olá, {viewModel.renterName}! Você está mais perto da sua casa própria 🎉</h1>
        <p className={styles.greetingSub}>Cada token comprado aumenta sua participação no imóvel e reduz o aluguel ao longo da jornada.</p>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroInner}>
          <div className={styles.progressSide}>
            <div className={styles.gaugeCol}>
              <div className={styles.gaugeContainer}>
                <svg className={styles.gaugeSvg} viewBox="0 0 240 240" aria-hidden="true">
                  <defs>
                    <linearGradient id="fmz-renter-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1A8C5B" />
                      <stop offset="62%" stopColor="#27AE60" />
                      <stop offset="100%" stopColor="#F5C842" />
                    </linearGradient>
                    <filter id="fmz-renter-glow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle className={styles.arcBg} cx="120" cy="120" r="90" strokeDasharray="282.7 282.7" strokeDashoffset="-141.3" />
                  <circle className={styles.arcGlow} cx="120" cy="120" r="90" strokeDasharray={hasAnimated ? `${filledArc} ${CIRCLE_CIRCUMFERENCE - filledArc}` : `0 ${CIRCLE_CIRCUMFERENCE}`} strokeDashoffset="-141.3" />
                  <circle className={styles.arcProgress} cx="120" cy="120" r="90" strokeDasharray={hasAnimated ? `${filledArc} ${CIRCLE_CIRCUMFERENCE - filledArc}` : `0 ${CIRCLE_CIRCUMFERENCE}`} strokeDashoffset="-141.3" />
                  <circle cx={gaugePoint.x} cy={gaugePoint.y} r="7" fill="var(--fmz-gold)" stroke="#fff" strokeWidth="2.5" style={{ transition: 'all 2s cubic-bezier(.4,0,.2,1)' }} filter="url(#fmz-renter-glow)" />
                  <text x="20" y="175" fontSize="11" fill="#9AA3B0" fontFamily="DM Sans" fontWeight="600">0%</text>
                  <text x="206" y="175" fontSize="11" fill="#9AA3B0" fontFamily="DM Sans" fontWeight="600" textAnchor="end">100%</text>
                  <circle cx={nextMilestonePoint.x} cy={nextMilestonePoint.y} r="4" fill="#F0D870" stroke="#C8A020" strokeWidth="1.5" opacity="0.75" />
                </svg>

                <div className={styles.gaugeText}>
                  <div className={styles.gaugePercent}>{animatedPercentage.toFixed(1).replace('.', ',')}<span>%</span></div>
                  <div className={styles.gaugeLabel}>da casa<br />já é sua ✨</div>
                  <div className={styles.gaugeBadge}>↗ {viewModel.monthlySavingsLabel}/mês economizado</div>
                </div>
              </div>
            </div>

            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}><span className={styles.eyebrowDot} />Sua jornada de compra</div>
              <h2 className={styles.heroTitle}>Você já é dona de <em>{viewModel.ownershipPercentageLabel}</em> da sua casa</h2>
              <p className={styles.heroDescription}>Quanto mais tokens você compra, maior fica sua participação no imóvel — e menor fica o aluguel pago todos os meses.</p>
              <div className={styles.heroMiniMetrics}>
                <div className={`${styles.miniPill} ${styles.miniPillSuccess}`}><strong>{viewModel.acquiredTokensLabel}</strong> em tokens adquiridos</div>
                <div className={styles.miniPill}><strong>{viewModel.remainingToOwnLabel}</strong> para 100%</div>
              </div>
            </div>
          </div>

          <aside className={styles.ctaPanel}>
            <div className={styles.ctaContent}>
              <div className={styles.ctaKicker}>🎯 próximo marco</div>
              <h3 className={styles.ctaTitle}>Faltam {viewModel.nextMilestoneRemainingLabel} para chegar em {viewModel.nextMilestoneLabel}</h3>
              <p className={styles.ctaDescription}>Ao atingir o próximo marco, seu aluguel pode cair mais <strong>{viewModel.nextMilestoneRentReductionLabel}/mês</strong>. Comprar tokens agora acelera sua jornada até a casa própria.</p>
              <div className={styles.ctaImpact}>
                <div className={styles.impactItem}>
                  <div className={`${styles.impactValue} ${styles.impactValueSuccess}`}>− {viewModel.nextMilestoneRentReductionLabel}</div>
                  <div className={styles.impactLabel}>estimado no aluguel mensal</div>
                </div>
                <div className={styles.impactItem}>
                  <div className={styles.impactValue}>{viewModel.nextMilestoneLabel}</div>
                  <div className={styles.impactLabel}>próximo objetivo da jornada</div>
                </div>
              </div>
              <Link href="/connected/tokensToPurchasePix" className={styles.primaryButton}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Comprar mais tokens
              </Link>
              <div className={styles.ctaSmall}>Cada compra aproxima você da propriedade total.</div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.timelineCard}>
        <div className={styles.sectionHead}>
          <div>
            <h3 className={styles.cardTitle}>Sua jornada até a casa própria</h3>
            <p className={styles.cardSub}>A casa acompanha exatamente o avanço da sua participação no imóvel.</p>
          </div>
        </div>
        <div className={styles.timelineWrap}>
          <div className={styles.timelineLabel} style={timelineStyle}>{viewModel.ownershipPercentageLabel} — você</div>
          <div className={styles.timelineTrack}>
            <div className={styles.timelineFill} style={{ width: hasAnimated ? `${viewModel.ownershipPercentage}%` : '0%' }} />
            <div className={styles.timelineHouse} style={timelineStyle}>🏡</div>
          </div>
          <div className={styles.timelinePoints}>
            {[0, 5, viewModel.nextMilestonePercentage, 25, 50, 100].map((point) => {
              const isDone = point < viewModel.ownershipPercentage;
              const isNext = point === viewModel.nextMilestonePercentage;
              return (
                <div key={point} className={`${styles.timelinePoint} ${isDone ? styles.timelinePointDone : ''} ${isNext ? styles.timelinePointNext : ''}`}>
                  <div className={`${styles.timelineDot} ${isDone ? styles.timelineDotDone : ''} ${isNext ? styles.timelineDotNext : ''}`} />
                  <div className={styles.timelinePointLabel}>{point}%{isNext ? ' 🎯' : point === 100 ? ' 🏠' : ''}</div>
                </div>
              );
            })}
          </div>
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
          <Link href="/connected/recordsMenu?target=history" className={styles.secondaryLink}>Ver histórico de pagamentos →</Link>
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
    </main>
  );
}

export { hasRenterDashboardData };
