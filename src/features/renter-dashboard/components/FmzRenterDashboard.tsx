'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, FileText, Home, LayoutGrid, MessageCircle, Plus, Target, TrendingUp, Wrench } from 'lucide-react';
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
  unreadCount?: number;
};

const LINE_ICON: Record<string, typeof CreditCard> = {
  'current-rent': Home,
  'rent-with-discount': Home,
  'rent-fee': DollarSign,
  'condominium': LayoutGrid,
  'scheduled-token-purchase': Target,
  'token-purchase': Target,
  'token-purchase-fee': DollarSign,
  'token-fee': DollarSign,
};

const quickActions: QuickAction[] = [
  { title: 'Manutenção', description: 'Nenhum chamado aberto', href: '/connected/maintenances', icon: Wrench },
  { title: 'Falar com a gestora', description: 'Você tem 1 mensagem não lida', href: '/connected/recordsMenu', icon: MessageCircle, unreadCount: 1 },
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

export function FmzRenterDashboard({
  dashboard,
  paymentHistory = [],
  onPayInvoice,
}: FmzRenterDashboardProps) {
  const viewModel = useMemo(() => buildRenterDashboardViewModel(dashboard), [dashboard]);

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    setHasAnimated(false);
    const t = window.setTimeout(() => setHasAnimated(true), 180);
    return () => window.clearTimeout(t);
  }, [viewModel.ownershipPercentage]);

  const timelineStyle = buildLeftStyle(hasAnimated ? viewModel.ownershipVisualPosition : 0);

  const handlePayInvoice = () => {
    if (onPayInvoice) { onPayInvoice(viewModel.invoice.paymentUrl); return; }
    if (viewModel.invoice.paymentUrl) {
      window.open(viewModel.invoice.paymentUrl, '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
    }
  };

  const billSplit = splitBillAmount(viewModel.invoice.totalLabel);
  const nextInteger = splitNextAmount(viewModel.nextMilestoneRemainingLabel);

  return (
    <main className={styles.dashboard}>

      {/* Page head */}
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>
          Olá, {viewModel.renterName}
        </h1>
        <div className={styles.pageSub}>
          <span className={styles.pillGreen}><span className={styles.dot} />Contrato ativo</span>
        </div>
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

        {/* Next milestone card */}
        <div className={styles.nextCard}>
          <span className={styles.nextEyebrow}>
            <span className={styles.nbadge}><Target size={10} /></span>
            Próximo marco · {viewModel.nextMilestoneLabel}
          </span>
          <h3 className={styles.nextTitle}>Faltam apenas</h3>
          <div className={styles.nextAmount}>
            <span className={styles.currency}>R$</span>{nextInteger}
          </div>
          <p className={styles.nextDesc}>
            Ao atingir {viewModel.nextMilestoneLabel} de posse, seu aluguel pode reduzir em {viewModel.nextMilestoneRentReductionLabel} por mês.
          </p>

          <div className={styles.nextProgress}>
            <div className={styles.nextProgressBar}>
              <div className={styles.nextProgressFill} style={{ width: hasAnimated ? `${viewModel.nextMilestoneProgressPercentage}%` : '0%' }} />
            </div>
            <div className={styles.nextProgressText}>
              <span>Progresso até {viewModel.nextMilestoneLabel}</span>
              <span className={styles.mono}>{viewModel.ownershipPercentageLabel}</span>
            </div>
          </div>

          <Link href="/connected/tokensToPurchasePix" className={styles.btnCta}>
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
                {action.unreadCount ? <span className={styles.quickBadge}>{action.unreadCount}</span> : null}
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
