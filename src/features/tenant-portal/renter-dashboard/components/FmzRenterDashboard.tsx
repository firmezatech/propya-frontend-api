'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Plus, TrendingUp } from 'lucide-react';
import type { FmzTenantDashboard } from '../../domain/fmz-tenant-portal.types';
import type { TenantOwnershipGoal } from '../../domain/fmz-tenant-portal.types';
import type { FmzTenantPaymentHistoryItem } from '../../domain';
import type { FmzDashboardMoneyLine } from '../domain/fmz-renter-dashboard.types';
import { buildRenterDashboardViewModel, hasRenterDashboardData } from '../domain/fmz-renter-dashboard-view-model';
import { FmzRenterDashboardPaymentHistoryCard } from './FmzRenterDashboardPaymentHistoryCard';
import { buildFmzLocalizedHref } from '../../../../lib/fmz-localize-href';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardProps = {
  dashboard: FmzTenantDashboard;
  paymentHistory?: FmzTenantPaymentHistoryItem[];
  onPayInvoice?: (paymentUrl?: string | null) => void;
};

// ─── Ownership Goal Slide — view model for carousel rendering ─────────────────
// This is a presentational type only. All numeric and label values come from
// the backend via TenantOwnershipGoal. No business calculations here.

type OwnershipGoalSlide = {
  id: string;
  label: string;
  amountLabel: string;
  targetLabel: string;
  description: string;
  progressLabel: string;
  progressPercentage: number;
  rewardDescription: string | null;
};

// Bill lines that belong under the "Moradia" group; anything else (token
// purchase + its fee) falls under "Sua compra do imóvel".
const HOUSING_LINE_KEYS = new Set([
  'current-rent', 'rent-with-discount', 'discounted_rent',
  'rent-fee', 'rental_admin_fee',
  'condominium', 'condominium_fee',
]);

function groupInvoiceLines(lines: FmzDashboardMoneyLine[]): { housing: FmzDashboardMoneyLine[]; investment: FmzDashboardMoneyLine[] } {
  const housing: FmzDashboardMoneyLine[] = [];
  const investment: FmzDashboardMoneyLine[] = [];
  for (const line of lines) {
    (HOUSING_LINE_KEYS.has(line.key) ? housing : investment).push(line);
  }
  return { housing, investment };
}

function renderInvoiceLineGroup(title: string, isInvestmentGroup: boolean, lines: FmzDashboardMoneyLine[]) {
  if (lines.length === 0) return null;
  return (
    <div className={`${styles.billGroup} ${isInvestmentGroup ? styles.billGroupInvest : ''}`}>
      <div className={styles.billGroupLabel}>
        <span className={styles.billGroupDot} />
        {title}
      </div>
      {lines.map((line) => {
        const isAccent = line.tone === 'warning';
        return (
          <div key={line.key} className={styles.billLine}>
            <span className={`${styles.blLabel} ${isAccent ? styles.blLabelAccent : ''}`}>{line.label}</span>
            <span className={styles.blVal}>{line.value}</span>
          </div>
        );
      })}
    </div>
  );
}

const BUY_TOKENS_PATH = '/connected/tokens-to-purchase-pix';

const buildLeftStyle = (pct: number) => ({ left: `${Math.min(Math.max(pct, 0), 100)}%` });

function splitBillAmount(label: string): { integer: string; decimal: string } {
  const withoutPrefix = label.replace(/^R\$\s*/, '');
  const commaIdx = withoutPrefix.lastIndexOf(',');
  if (commaIdx !== -1) {
    return { integer: withoutPrefix.slice(0, commaIdx), decimal: withoutPrefix.slice(commaIdx) };
  }
  return { integer: withoutPrefix, decimal: '' };
}

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const goalPercentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

function formatGoalMoney(value: number): string {
  return moneyFormatter.format(Math.max(value, 0));
}

function formatGoalPercent(value: number): string {
  return `${goalPercentFormatter.format(Math.min(Math.max(value, 0), 100))}%`;
}

// ─── Backend goal → presentational slide ─────────────────────────────────────
// Pure mapping — no business logic, no calculations.
// Every value comes from the backend's TenantOwnershipGoal.

function mapGoalToSlide(goal: TenantOwnershipGoal): OwnershipGoalSlide {
  const amountLabel = formatGoalMoney(goal.amountRemaining);
  return {
    id: goal.id,
    label: goal.title,
    amountLabel,
    targetLabel: `${formatGoalPercent(goal.targetPercentage)} do seu imóvel`,
    description: goal.description,
    progressLabel: `Progresso até ${formatGoalPercent(goal.targetPercentage)}`,
    progressPercentage: Math.min(Math.max(goal.progressPercentage, 0), 100),
    rewardDescription: goal.rewardDescription,
  };
}

/**
 * Derives the ownership goal slides from the backend payload.
 *
 * Sort strategy (defensive — applied if backend does not guarantee order):
 *   1. tokensRemaining ASC  (closest to completion first)
 *   2. targetTokenAmount ASC
 *   3. displayOrder ASC
 *
 * The frontend must never generate goals locally.
 * If `ownershipGoals.available` is empty, the caller renders an empty state.
 *
 * Time:  O(n log n) where n = available goals (typically < 10)
 * Space: O(n)
 */
function buildOwnershipGoalSlidesFromBackend(
  dashboard: FmzTenantDashboard,
): OwnershipGoalSlide[] {
  const available = dashboard.ownershipGoals?.available ?? [];

  if (available.length === 0) return [];

  const sorted = [...available].sort(
    (a, b) =>
      a.tokensRemaining - b.tokensRemaining ||
      a.targetTokenAmount - b.targetTokenAmount ||
      a.displayOrder - b.displayOrder,
  );

  return sorted.map(mapGoalToSlide);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FmzRenterDashboard({
  dashboard,
  paymentHistory = [],
  onPayInvoice,
}: FmzRenterDashboardProps) {
  const viewModel = useMemo(() => buildRenterDashboardViewModel(dashboard), [dashboard]);

  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const tokenizationId = dashboard.ownership?.propertyTokenizationId ?? null;
  const propertyId     = dashboard.property?.id ?? null;
  const buyTokensQuery = [
    tokenizationId && `propertyTokenizationId=${encodeURIComponent(String(tokenizationId))}`,
    propertyId     && `propertyId=${encodeURIComponent(String(propertyId))}`,
  ].filter(Boolean).join('&');
  const buyTokensHref = buildFmzLocalizedHref(
    params?.locale,
    buyTokensQuery ? `${BUY_TOKENS_PATH}?${buyTokensQuery}` : BUY_TOKENS_PATH,
  );
  const [hasAnimated, setHasAnimated] = useState(false);

  // Reference mockup (Dashboard.html) shows a single "next goal" box — when the
  // backend returns more than one available goal, only the closest one renders here.
  const currentGoal = useMemo(
    () => buildOwnershipGoalSlidesFromBackend(dashboard)[0] ?? null,
    [dashboard],
  );

  useEffect(() => {
    setHasAnimated(false);
    const t = window.setTimeout(() => setHasAnimated(true), 180);
    return () => window.clearTimeout(t);
  }, [viewModel.ownershipPercentage]);

  const timelineStyle = buildLeftStyle(hasAnimated ? viewModel.ownershipVisualPosition : 0);

  const handlePayInvoice = () => {
    if (onPayInvoice) { onPayInvoice(viewModel.invoice.paymentUrl); return; }
    router.push('/connected/issue-invoice');
  };

  const billSplit = splitBillAmount(viewModel.invoice.totalLabel);
  const groupedInvoiceLines = useMemo(() => groupInvoiceLines(viewModel.invoice.lines), [viewModel.invoice.lines]);

  return (
    <main className={styles.dashboard}>

      {/* Page head */}
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>
          Olá, {viewModel.renterName}
        </h1>
        <div className={styles.pageSub}>
          <span className={styles.pillGreen}><span className={styles.dot} />{viewModel.contractStatusLabel}</span>
          {viewModel.propertyAddressLabel ? (
            <>
              <span className={styles.dot} />
              <span>{viewModel.propertyAddressLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Hero: Journey + Next milestone */}
      <section className={styles.hero}>
        <div className={styles.heroTop}>

          <div>
            <span className={styles.eyebrow}>
              <span className={styles.ico}><TrendingUp size={11} /></span>
              Sua jornada de compra
            </span>
            <h2 className={styles.heroH}>
              Você já conquistou <span className={styles.pctBig}>{viewModel.ownershipPercentageLabel}</span> do seu imóvel
            </h2>
            <p className={styles.heroP}>
              No seu ritmo atual, você atinge a próxima meta de {viewModel.nextMilestoneLabel} em breve, continue avançando!
            </p>
          </div>

          {currentGoal ? (
            <div className={styles.heroGoal}>
              <div className={styles.k}>Próxima conquista</div>
              <div className={styles.amt}>{currentGoal.targetLabel}</div>
              <div className={styles.cap}>Compre mais {currentGoal.amountLabel} para avançar</div>
              <Link href={buyTokensHref} className={`${styles.btn} ${styles.btnLime}`}>
                <Plus size={14} /> Comprar tokens
              </Link>
            </div>
          ) : (
            <div className={styles.heroGoal}>
              <div className={styles.k}>Metas de posse</div>
              <div className={styles.cap}>🎉 Você já concluiu todas as metas disponíveis no momento.</div>
              <Link href={buyTokensHref} className={`${styles.btn} ${styles.btnLime}`}>
                <Plus size={14} /> Comprar tokens
              </Link>
            </div>
          )}

        </div>

        <div className={styles.trail}>
          <div className={styles.tmBadge} style={timelineStyle}>
            {viewModel.ownershipPercentageLabel} · {viewModel.acquiredTokensLabel}
          </div>
          <div className={styles.trailTrack}>
            <div className={styles.trailFill} style={{ width: hasAnimated ? `${viewModel.ownershipVisualPosition}%` : '0%' }} />
            <div className={styles.trailMarker} style={timelineStyle} />
          </div>
          <div className={styles.trailMarks}>
            {viewModel.journeyMilestones.map((m) => (
              <div
                key={m.percentage}
                className={`${styles.tm} ${m.status === 'done' ? styles.tmDone : ''} ${m.status === 'next' ? styles.tmNext : ''}`}
                style={buildLeftStyle(m.visualPosition)}
              >
                <div className={styles.tick} />
                <div className={styles.pct}>{m.label}</div>
                <div className={styles.val}>{m.amountLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content grid: bill + right stack */}
      <div className={styles.contentGrid}>

        {/* Bill card */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitle}>
              <span className={styles.ico}><CreditCard size={13} /></span>
              Resumo do mês
            </div>
            <span className={`${styles.cardAction} ${styles.mono}`}>{viewModel.referenceMonthLabel.toUpperCase()}</span>
          </div>

          <div className={styles.billTotal}>
            <span className={styles.billCurrency}>R$</span>
            {billSplit.integer}
            {billSplit.decimal && <span className={styles.billCents}>{billSplit.decimal}</span>}
          </div>
          <div className={styles.billDue}>
            <span className={styles.billDueChip}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {viewModel.invoice.daysUntilDue != null && viewModel.invoice.daysUntilDue > 0
                ? `Vence em ${viewModel.invoice.daysUntilDue} ${viewModel.invoice.daysUntilDue === 1 ? 'dia' : 'dias'}`
                : 'Vencimento'}
            </span>
            <span className={`${styles.billDueDate} ${styles.mono}`}>{viewModel.invoice.dueDateLabel}</span>
          </div>

          <div className={styles.billLines}>
            {renderInvoiceLineGroup('Moradia', false, groupedInvoiceLines.housing)}
            {renderInvoiceLineGroup('Sua compra do imóvel', true, groupedInvoiceLines.investment)}
          </div>

          <div className={styles.billTotalRow}>
            <span className={styles.billTotalLbl}>Total a pagar</span>
            <span className={styles.billTotalVal}>{viewModel.invoice.totalLabel}</span>
          </div>

          <button type="button" className={styles.btnCta} onClick={handlePayInvoice}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Pagar boleto
          </button>
        </div>

        {/* Right: history */}
        <div className={styles.rightStack}>
          <FmzRenterDashboardPaymentHistoryCard items={paymentHistory} />
        </div>

      </div>

    </main>
  );
}

export { hasRenterDashboardData };
