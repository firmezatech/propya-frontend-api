'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard, DollarSign, FileText, Home, LayoutGrid, MessageCircle, Plus, Target, TrendingUp, Wrench } from 'lucide-react';
import type { FmzTenantDashboard } from '../../domain/fmz-tenant-portal.types';
import type { TenantOwnershipGoal } from '../../domain/fmz-tenant-portal.types';
import type { FmzTenantPaymentHistoryItem } from '../../domain';
import { buildRenterDashboardViewModel, hasRenterDashboardData } from '../domain/fmz-renter-dashboard-view-model';
import { FmzRenterDashboardPaymentHistoryCard } from './FmzRenterDashboardPaymentHistoryCard';
import { FmzRenterDashboardRentSimulatorCard } from './FmzRenterDashboardRentSimulatorCard';
import { buildFmzLocalizedHref } from '../../../../lib/fmz-localize-href';
import styles from './FmzRenterDashboard.module.css';

type FmzRenterDashboardProps = {
  dashboard: FmzTenantDashboard;
  paymentHistory?: FmzTenantPaymentHistoryItem[];
  onPayInvoice?: (paymentUrl?: string | null) => void;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: typeof Wrench;
};

// ─── Ownership Goal Slide — view model for carousel rendering ─────────────────
// This is a presentational type only. All numeric and label values come from
// the backend via TenantOwnershipGoal. No business calculations here.

type OwnershipGoalSlide = {
  id: string;
  label: string;
  amountLabel: string;
  description: string;
  progressLabel: string;
  progressPercentage: number;
  rewardDescription: string | null;
};

const LINE_ICON: Record<string, typeof CreditCard> = {
  'current-rent': Home,
  'rent-with-discount': Home,
  'discounted_rent': Home,
  'rent-fee': DollarSign,
  'rental_admin_fee': DollarSign,
  'condominium': LayoutGrid,
  'condominium_fee': LayoutGrid,
  'scheduled-token-purchase': Target,
  'scheduled_token_purchase': Target,
  'token-purchase': Target,
  'token-purchase-fee': DollarSign,
  'token_purchase_fee': DollarSign,
  'token-fee': DollarSign,
  'token_fee': DollarSign,
};

const COMING_SOON_PATH = '/connected/coming-soon';
const BUY_TOKENS_PATH = '/connected/tokens-to-purchase-pix';
const TENANT_SUPPORT_BUTTONS_HREF = COMING_SOON_PATH;

const quickActions: QuickAction[] = [
  { title: 'Manutenção', description: 'Solicite suporte para o imóvel', href: TENANT_SUPPORT_BUTTONS_HREF, icon: Wrench },
  { title: 'Falar com a gestora', description: 'Entre em contato com a gestão', href: TENANT_SUPPORT_BUTTONS_HREF, icon: MessageCircle },
  { title: 'Documentação', description: 'Contratos e documentos do imóvel', href: '/connected/my-contract', icon: FileText },
];

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

function splitGoalAmountInteger(label: string): string {
  const withoutPrefix = label.replace(/^R\$\s*/, '');
  const commaIdx = withoutPrefix.lastIndexOf(',');
  return commaIdx !== -1 ? withoutPrefix.slice(0, commaIdx) : withoutPrefix;
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
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  const ownershipGoalSlides = useMemo(
    () => buildOwnershipGoalSlidesFromBackend(dashboard),
    [dashboard],
  );

  const hasGoals = ownershipGoalSlides.length > 0;
  const currentGoal = ownershipGoalSlides[currentGoalIndex] ?? null;

  useEffect(() => {
    setHasAnimated(false);
    const t = window.setTimeout(() => setHasAnimated(true), 180);
    return () => window.clearTimeout(t);
  }, [viewModel.ownershipPercentage]);

  useEffect(() => {
    setCurrentGoalIndex(0);
  }, [dashboard.ownershipGoals]);

  const timelineStyle = buildLeftStyle(hasAnimated ? viewModel.ownershipVisualPosition : 0);

  const handlePayInvoice = () => {
    if (onPayInvoice) { onPayInvoice(viewModel.invoice.paymentUrl); return; }
    router.push('/connected/issue-invoice');
  };

  const billSplit = splitBillAmount(viewModel.invoice.totalLabel);
  const goalAmountInteger = currentGoal ? splitGoalAmountInteger(currentGoal.amountLabel) : null;

  const showPreviousGoal = () => {
    setCurrentGoalIndex((current) => (current - 1 + ownershipGoalSlides.length) % ownershipGoalSlides.length);
  };

  const showNextGoal = () => {
    setCurrentGoalIndex((current) => (current + 1) % ownershipGoalSlides.length);
  };

  return (
    <main className={styles.dashboard}>

      {/* Page head */}
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>
          Olá, {viewModel.renterName}
        </h1>
      </div>

      {/* Hero: Journey + Next milestone */}
      <section className={styles.hero}>

        {/* Journey card */}
        <div className={styles.journeyCard}>
          <span className={styles.jEyebrow}>
            <span className={styles.eIco}><TrendingUp size={11} /></span>
            Sua jornada de compra
          </span>
          <h2 className={styles.jTitle}>
            Você já é dona de <span className={styles.pctBig}>{viewModel.ownershipPercentageLabel}</span> da sua casa
          </h2>
          <p className={styles.jDesc}>
            No seu ritmo atual de compra, você atinge a próxima meta de {viewModel.nextMilestoneLabel} em breve.
          </p>

          <div className={styles.jTl}>
            <div className={styles.jTlWrap}>
              <div className={styles.jTlBubble} style={timelineStyle}>{viewModel.ownershipPercentageLabel}</div>
              <div className={styles.jTlHouse} style={timelineStyle}>🏡</div>
              <div className={styles.jTlTrack}>
                <div className={styles.jTlFill} style={{ width: hasAnimated ? `${viewModel.ownershipVisualPosition}%` : '0%' }} />
              </div>
              <div className={styles.jTlPoints}>
                {viewModel.journeyMilestones.map((m) => (
                  <div
                    key={m.percentage}
                    className={`${styles.jpt} ${m.status === 'done' ? styles.jptDone : ''} ${m.status === 'next' ? styles.jptNext : ''}`}
                    style={buildLeftStyle(m.visualPosition)}
                  >
                    <div className={styles.jptTick} />
                    <div className={styles.jptLabel}>{m.label}</div>
                    <div className={styles.jptCap}>{m.caption}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ownership goals carousel — powered by backend data */}
        <div className={styles.nextCard}>
          {hasGoals && currentGoal ? (
            <>
              <div className={styles.goalCarouselHead}>
                <span className={styles.nextEyebrow}>
                  <span className={styles.nbadge}><Target size={10} /></span>
                  {currentGoal.label}
                </span>
                {ownershipGoalSlides.length > 1 ? (
                  <div className={styles.goalCarouselControls}>
                    <button type="button" className={styles.goalNavButton} onClick={showPreviousGoal} aria-label="Meta anterior">
                      <ChevronLeft size={13} />
                    </button>
                    <span className={styles.goalCounter}>{currentGoalIndex + 1}/{ownershipGoalSlides.length}</span>
                    <button type="button" className={styles.goalNavButton} onClick={showNextGoal} aria-label="Próxima meta">
                      <ChevronRight size={13} />
                    </button>
                  </div>
                ) : null}
              </div>

              <div key={currentGoal.id} className={styles.goalCarouselBody}>
                <h3 className={styles.nextTitle}>Faltam apenas</h3>
                <div className={styles.nextAmount}>
                  <span className={styles.currency}>R$</span>{goalAmountInteger}
                </div>
                <p className={styles.nextDesc}>{currentGoal.description}</p>

                <div className={styles.nextProgress}>
                  <div className={styles.nextProgressBar}>
                    <div className={styles.nextProgressFill} style={{ width: hasAnimated ? `${currentGoal.progressPercentage}%` : '0%' }} />
                  </div>
                  <div className={styles.nextProgressText}>
                    <span>{currentGoal.progressLabel}</span>
                    <span className={styles.mono}>{formatGoalPercent(currentGoal.progressPercentage)}</span>
                  </div>
                </div>

                {currentGoal.rewardDescription ? (
                  <p className={styles.nextDesc} style={{ marginTop: 8, fontStyle: 'italic', opacity: 0.8 }}>
                    🎁 {currentGoal.rewardDescription}
                  </p>
                ) : null}
              </div>

              {ownershipGoalSlides.length > 1 ? (
                <div className={styles.goalDots} aria-label="Metas disponíveis">
                  {ownershipGoalSlides.map((goal, index) => (
                    <button
                      key={goal.id}
                      type="button"
                      aria-label={`Ir para meta ${index + 1}`}
                      aria-current={index === currentGoalIndex ? 'true' : undefined}
                      className={`${styles.goalDot} ${index === currentGoalIndex ? styles.goalDotActive : ''}`}
                      onClick={() => setCurrentGoalIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            /* Empty state — all goals achieved */
            <div className={styles.goalCarouselBody}>
              <span className={styles.nextEyebrow}>
                <span className={styles.nbadge}><Target size={10} /></span>
                Metas de posse
              </span>
              <p className={styles.nextDesc} style={{ marginTop: 12 }}>
                🎉 Você já concluiu todas as metas disponíveis no momento.
              </p>
            </div>
          )}

          <Link href={buyTokensHref} className={styles.btnCta}>
            <Plus size={14} /> Comprar mais tokens
          </Link>
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
            {viewModel.invoice.lines.map((line) => {
              const Icon = LINE_ICON[line.key] ?? CreditCard;
              const isHighlight = line.tone === 'warning';
              return (
                <div key={line.key} className={styles.billLine}>
                  <span className={`${styles.blLabel} ${isHighlight ? styles.blLabelHighlight : ''}`}>
                    <span className={`${styles.bli} ${isHighlight ? styles.bliHighlight : ''}`}>
                      <Icon size={11} />
                    </span>
                    {line.label}
                  </span>
                  <span className={`${styles.blVal} ${line.tone === 'success' ? styles.blValGreen : ''} ${line.tone === 'warning' ? styles.blValGold : ''}`}>
                    {line.value}
                  </span>
                </div>
              );
            })}
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

        {/* Right: simulator + history */}
        <div className={styles.rightStack}>
          <FmzRenterDashboardRentSimulatorCard viewModel={viewModel} hasAnimated={hasAnimated} />
          <FmzRenterDashboardPaymentHistoryCard items={paymentHistory} />
        </div>

      </div>

      {/* Quick actions */}
      <div className={styles.quickGrid}>
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href} className={styles.quickCard}>
            <div className={styles.quickIco}>
              <action.icon size={18} />
            </div>
            <div className={styles.quickBody}>
              <div className={styles.quickTitle}>
                {action.title}
              </div>
              <div className={styles.quickSub}>{action.description}</div>
            </div>
            <svg className={styles.quickArrow} width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>

    </main>
  );
}

export { hasRenterDashboardData };
