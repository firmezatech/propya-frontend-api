'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard, DollarSign, FileText, Home, LayoutGrid, MessageCircle, Plus, Target, TrendingUp, Wrench } from 'lucide-react';
import type { FmzTenantDashboard } from '../../../features/tenant-portal/domain/fmz-tenant-portal.types';
import type { FmzTenantPaymentHistoryItem } from '../../../features/tenant-portal/domain';
import { buildRenterDashboardViewModel, hasRenterDashboardData } from '../domain/fmz-renter-dashboard-view-model';
import { FmzRenterDashboardPaymentHistoryCard } from './FmzRenterDashboardPaymentHistoryCard';
import { FmzRenterDashboardRentSimulatorCard } from './FmzRenterDashboardRentSimulatorCard';
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

type OwnershipGoalSlide = {
  id: string;
  label: string;
  amountLabel: string;
  description: string;
  progressLabel: string;
  progressPercentage: number;
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

const COMING_SOON_PATH = '/connected/comingSoon';
const TENANT_SUPPORT_BUTTONS_HREF = COMING_SOON_PATH;

const quickActions: QuickAction[] = [
  { title: 'Manutenção', description: 'Solicite suporte para o imóvel', href: TENANT_SUPPORT_BUTTONS_HREF, icon: Wrench },
  { title: 'Falar com a gestora', description: 'Entre em contato com a gestão', href: TENANT_SUPPORT_BUTTONS_HREF, icon: MessageCircle },
  { title: 'Documentação', description: 'Contratos e documentos do imóvel', href: '/connected/myContract', icon: FileText },
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

function splitNextAmount(label: string): string {
  const withoutPrefix = label.replace(/^R\$\s*/, '');
  const commaIdx = withoutPrefix.lastIndexOf(',');
  return commaIdx !== -1 ? withoutPrefix.slice(0, commaIdx) : withoutPrefix;
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

function splitGoalAmount(label: string): string {
  return splitNextAmount(label);
}

function buildOwnershipGoalSlides(viewModel: ReturnType<typeof buildRenterDashboardViewModel>): OwnershipGoalSlide[] {
  const currentOwnedValue = Math.max(viewModel.acquiredTokensNumber, 0);
  const propertyValue = Math.max(viewModel.propertyValueNumber, 0);
  const baseRent = Math.max(viewModel.originalRentNumber, 0);
  const candidateTargets = [viewModel.nextMilestonePercentage, 20, 40, 60, 100]
    .filter((target, index, targets) => target > viewModel.ownershipPercentage && targets.indexOf(target) === index)
    .sort((left, right) => left - right);

  const targets = candidateTargets.length > 0 ? candidateTargets.slice(0, 4) : [100];

  return targets.map((target, index) => {
    const targetValue = propertyValue > 0 ? propertyValue * (target / 100) : viewModel.nextMilestoneRemainingNumber;
    const amountNeeded = index === 0
      ? viewModel.nextMilestoneRemainingNumber
      : Math.max(targetValue - currentOwnedValue, 0);
    const progressPercentage = index === 0
      ? viewModel.nextMilestoneProgressPercentage
      : (targetValue > 0 ? Math.min(Math.max((currentOwnedValue / targetValue) * 100, 0), 100) : viewModel.ownershipPercentage);
    const rentReduction = index === 0
      ? viewModel.nextMilestoneRentReductionLabel
      : formatGoalMoney(baseRent * (target / 100));
    const targetLabel = formatGoalPercent(target);
    const isFinalGoal = target >= 100;

    return {
      id: `goal-${target}`,
      label: `${isFinalGoal ? 'Marco final' : 'Próximo marco'} · ${targetLabel}`,
      amountLabel: formatGoalMoney(amountNeeded),
      description: isFinalGoal
        ? 'Com 100% de posse, você elimina completamente o custo de aluguel do imóvel.'
        : `Ao atingir ${targetLabel} de posse, seu aluguel pode reduzir em ${rentReduction} por mês.`,
      progressLabel: `Progresso até ${targetLabel}`,
      progressPercentage,
    };
  });
}

export function FmzRenterDashboard({
  dashboard,
  paymentHistory = [],
  onPayInvoice,
}: FmzRenterDashboardProps) {
  const viewModel = useMemo(() => buildRenterDashboardViewModel(dashboard), [dashboard]);

  const router = useRouter();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const ownershipGoalSlides = useMemo(() => buildOwnershipGoalSlides(viewModel), [viewModel]);
  const currentGoal = ownershipGoalSlides[currentGoalIndex] ?? ownershipGoalSlides[0];

  useEffect(() => {
    setHasAnimated(false);
    const t = window.setTimeout(() => setHasAnimated(true), 180);
    return () => window.clearTimeout(t);
  }, [viewModel.ownershipPercentage]);

  useEffect(() => {
    setCurrentGoalIndex(0);
  }, [viewModel.ownershipPercentage, viewModel.nextMilestonePercentage]);

  const timelineStyle = buildLeftStyle(hasAnimated ? viewModel.ownershipVisualPosition : 0);

  const handlePayInvoice = () => {
    if (onPayInvoice) { onPayInvoice(viewModel.invoice.paymentUrl); return; }
    router.push('/connected/issueInvoice');
  };

  const billSplit = splitBillAmount(viewModel.invoice.totalLabel);
  const nextInteger = splitGoalAmount(currentGoal?.amountLabel ?? viewModel.nextMilestoneRemainingLabel);

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

        {/* Ownership goals carousel */}
        <div className={styles.nextCard}>
          <div className={styles.goalCarouselHead}>
            <span className={styles.nextEyebrow}>
              <span className={styles.nbadge}><Target size={10} /></span>
              {currentGoal?.label ?? `Próximo marco · ${viewModel.nextMilestoneLabel}`}
            </span>
            <div className={styles.goalCarouselControls}>
              <button type="button" className={styles.goalNavButton} onClick={showPreviousGoal} aria-label="Meta anterior">
                <ChevronLeft size={13} />
              </button>
              <span className={styles.goalCounter}>{currentGoalIndex + 1}/{ownershipGoalSlides.length}</span>
              <button type="button" className={styles.goalNavButton} onClick={showNextGoal} aria-label="Próxima meta">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div key={currentGoal?.id ?? 'next-goal'} className={styles.goalCarouselBody}>
            <h3 className={styles.nextTitle}>Faltam apenas</h3>
            <div className={styles.nextAmount}>
              <span className={styles.currency}>R$</span>{nextInteger}
            </div>
            <p className={styles.nextDesc}>
              {currentGoal?.description ?? `Ao atingir ${viewModel.nextMilestoneLabel} de posse, seu aluguel pode reduzir em ${viewModel.nextMilestoneRentReductionLabel} por mês.`}
            </p>

            <div className={styles.nextProgress}>
              <div className={styles.nextProgressBar}>
                <div className={styles.nextProgressFill} style={{ width: hasAnimated ? `${currentGoal?.progressPercentage ?? viewModel.nextMilestoneProgressPercentage}%` : '0%' }} />
              </div>
              <div className={styles.nextProgressText}>
                <span>{currentGoal?.progressLabel ?? `Progresso até ${viewModel.nextMilestoneLabel}`}</span>
                <span className={styles.mono}>{formatGoalPercent(currentGoal?.progressPercentage ?? viewModel.nextMilestoneProgressPercentage)}</span>
              </div>
            </div>
          </div>

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

          <Link href={COMING_SOON_PATH} className={styles.btnCta}>
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
