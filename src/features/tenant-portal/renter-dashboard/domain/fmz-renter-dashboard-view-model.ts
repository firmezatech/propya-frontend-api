import type { FmzTenantDashboard, FmzTenantMonthlySummary } from '../../domain/fmz-tenant-portal.types';
import type { FmzRenterDashboardViewModel } from './fmz-renter-dashboard.types';
import { formatDateBR } from '../../../../lib/fmz-date';

const DEFAULT_RENTER_NAME = 'Diana';
const DEFAULT_REFERENCE_MONTH = 'Dezembro 2025';
const DEFAULT_NEXT_MILESTONE_PERCENTAGE = 25;

const JOURNEY_MILESTONES = [
  { percentage: 0   },
  { percentage: 25  },
  { percentage: 50  },
  { percentage: 75  },
  { percentage: 100 },
] as const;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

function normalizePercentage(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.max(value, 0));
}

function formatPercentage(value: number): string {
  return `${numberFormatter.format(normalizePercentage(value))}%`;
}

function formatPercentagePoints(value: number): string {
  return `${numberFormatter.format(Math.max(value, 0))} p.p.`;
}

function normalizeInvoiceLineLabel(label: string, key: string): string {
  if (key === 'current-rent' || key === 'rent-with-discount' || key === 'discounted_rent') return 'Aluguel';
  return label.trim().toLowerCase() === 'aluguel com desconto' ? 'Aluguel' : label;
}

function buildJourneyMilestones(ownershipPercentage: number, nextMilestonePercentage: number, totalPropertyValue: number) {
  return JOURNEY_MILESTONES.map((milestone) => ({
    percentage: milestone.percentage,
    label: `${numberFormatter.format(milestone.percentage)}%`,
    amountLabel: formatCurrency(milestone.percentage * totalPropertyValue / 100),
    visualPosition: milestone.percentage,
    status: milestone.percentage < ownershipPercentage
      ? 'done' as const
      : milestone.percentage === nextMilestonePercentage
        ? 'next' as const
        : 'future' as const,
  }));
}

// ── Invoice line builders ──────────────────────────────────────────────────────

type InvoiceLine = FmzRenterDashboardViewModel['invoice']['lines'][number];

function resolveInvoiceLineTone(key: string): InvoiceLine['tone'] {
  if (key === 'current-rent' || key === 'rent-with-discount' || key === 'discounted_rent') return 'success';
  if (key === 'scheduled-token-purchase' || key === 'token-purchase' || key === 'scheduled_token_purchase') return 'warning';
  return undefined;
}

function buildInvoiceLinesFromStructuredLines(lines: NonNullable<FmzTenantMonthlySummary['lines']>): InvoiceLine[] {
  return lines.map((line) => ({
    key: line.key,
    label: normalizeInvoiceLineLabel(line.label, line.key),
    value: formatCurrency(line.amount),
    tone: resolveInvoiceLineTone(line.key),
  }));
}

function buildInvoiceLinesFromLegacyFields(summary: FmzTenantMonthlySummary): InvoiceLine[] {
  const rentWithDiscount = summary.discountedRentAmount ?? summary.rentWithDiscountAmount ?? 0;
  const adminFee    = summary.rentalAdminFeeAmount ?? 0;
  const condominium = summary.condominiumFeeAmount ?? summary.condominiumAmount ?? 0;
  const tokenPurchase = summary.scheduledTokenPurchaseAmount ?? 0;
  const tokenFee    = summary.tokenFeeAmount ?? summary.tokenPurchaseFeeAmount ?? 0;

  const lines: InvoiceLine[] = [
    { key: 'current-rent', label: 'Aluguel', value: formatCurrency(rentWithDiscount), tone: 'success' },
  ];
  if (adminFee > 0)      lines.push({ key: 'rent-fee',               label: 'Taxa Adm Aluguel',               value: formatCurrency(adminFee) });
  if (condominium > 0)   lines.push({ key: 'condominium',            label: 'Condomínio',                    value: formatCurrency(condominium) });
  if (tokenPurchase > 0) lines.push({ key: 'scheduled-token-purchase', label: 'Compra programada de tokens', value: formatCurrency(tokenPurchase), tone: 'warning' });
  if (tokenFee > 0)      lines.push({ key: 'token-purchase-fee',     label: 'Taxa de compra de tokens',       value: formatCurrency(tokenFee) });

  return lines;
}

function buildInvoiceLinesFromSummary(summary: FmzTenantMonthlySummary | null | undefined): InvoiceLine[] {
  if (!summary) return [];
  if (summary.lines && summary.lines.length > 0) return buildInvoiceLinesFromStructuredLines(summary.lines);
  return buildInvoiceLinesFromLegacyFields(summary);
}

function computeDaysUntilDue(dueDate?: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ── Next-milestone resolution (dual-API compatibility) ─────────────────────────

type ResolvedNextGoal = {
  readonly percentage: number | null;
  readonly goalValue: number | null;
  readonly amountNeeded: number | null;
  readonly progressToGoalPercentage: number | null;
  readonly estimatedMonthlyRentReduction: number | null;
};

function resolveNextMilestone(dashboard: FmzTenantDashboard): ResolvedNextGoal {
  const fromNewApi = dashboard.ownershipGoals?.next;
  const fromLegacy = dashboard.nextGoal;

  if (fromNewApi != null) {
    return {
      percentage:                    fromNewApi.targetPercentage,
      goalValue:                     fromLegacy?.goalValue ?? null,
      amountNeeded:                  fromNewApi.amountRemaining,
      progressToGoalPercentage:      fromNewApi.progressPercentage,
      estimatedMonthlyRentReduction: fromLegacy?.estimatedMonthlyRentReduction ?? null,
    };
  }

  return {
    percentage:                    fromLegacy?.percentage ?? null,
    goalValue:                     fromLegacy?.goalValue ?? null,
    amountNeeded:                  fromLegacy?.amountNeeded ?? null,
    progressToGoalPercentage:      fromLegacy?.progressToGoalPercentage ?? null,
    estimatedMonthlyRentReduction: fromLegacy?.estimatedMonthlyRentReduction ?? null,
  };
}

// ── Sub-builders — each resolves one cohesive group of derived values ──────────

type OwnershipAmounts = {
  totalPropertyValue: number;
  currentOwnedValue: number;
  amountRemainingToFullOwnership: number;
};

function resolveOwnershipAmounts(
  ownership: FmzTenantDashboard['ownership'],
  ownershipPercentage: number,
): OwnershipAmounts {
  const totalPropertyValue = ownership?.totalPropertyValue ?? 0;
  const currentOwnedValue  = ownership?.currentOwnedValue ?? (totalPropertyValue * ownershipPercentage / 100);
  return {
    totalPropertyValue,
    currentOwnedValue,
    amountRemainingToFullOwnership: ownership?.amountRemainingToFullOwnership
      ?? Math.max(totalPropertyValue - currentOwnedValue, 0),
  };
}

type RentAmounts = {
  currentRentAmount: number;
  originalRentAmount: number;
  monthlySavings: number;
  yearlySavings: number;
};

function resolveRentAmounts(
  rentInsight: FmzTenantDashboard['rentInsight'],
  monthlySummary: FmzTenantDashboard['monthlySummary'],
): RentAmounts {
  const currentRentAmount = rentInsight?.discountedRentAmount
    ?? rentInsight?.currentRentAmount
    ?? monthlySummary?.discountedRentAmount
    ?? monthlySummary?.rentWithDiscountAmount
    ?? 0;
  const originalRentAmount = rentInsight?.adjustedBaseRentAmount
    ?? rentInsight?.originalRentAmount
    ?? monthlySummary?.adjustedBaseRentAmount
    ?? monthlySummary?.originalRentAmount
    ?? currentRentAmount;
  return {
    currentRentAmount,
    originalRentAmount,
    monthlySavings: rentInsight?.monthlySavingsAmount ?? 0,
    yearlySavings:  rentInsight?.annualSavingsAmount  ?? 0,
  };
}

type NextMilestoneCalcs = {
  nextMilestonePercentage: number;
  nextMilestoneRemaining: number;
  nextMilestoneProgressPercentage: number;
  estimatedNextReduction: number;
};

function resolveNextMilestoneCalcs(
  nextMilestone: ResolvedNextGoal,
  ownershipPercentage: number,
  totalPropertyValue: number,
  currentOwnedValue: number,
): NextMilestoneCalcs {
  const nextMilestonePercentage = nextMilestone.percentage != null
    ? normalizePercentage(nextMilestone.percentage)
    : Math.max(DEFAULT_NEXT_MILESTONE_PERCENTAGE, Math.ceil(ownershipPercentage / 5) * 5);
  const nextMilestoneTotal = nextMilestone.goalValue ?? (totalPropertyValue * (nextMilestonePercentage / 100));
  const nextMilestoneRemaining = nextMilestone.amountNeeded ?? Math.max(nextMilestoneTotal - currentOwnedValue, 0);
  const nextMilestoneProgressPercentage = nextMilestone.progressToGoalPercentage != null
    ? normalizePercentage(nextMilestone.progressToGoalPercentage)
    : (nextMilestoneTotal > 0 ? normalizePercentage((currentOwnedValue / nextMilestoneTotal) * 100) : 0);
  return {
    nextMilestonePercentage,
    nextMilestoneRemaining,
    nextMilestoneProgressPercentage,
    estimatedNextReduction: nextMilestone.estimatedMonthlyRentReduction ?? 0,
  };
}

// ── Public exports ─────────────────────────────────────────────────────────────

export function hasRenterDashboardData(dashboard: FmzTenantDashboard | null): boolean {
  return Boolean(
    dashboard &&
    typeof dashboard.ownership?.currentPercentage === 'number' &&
    (dashboard.rentInsight?.discountedRentAmount ||
      dashboard.rentInsight?.currentRentAmount ||
      dashboard.monthlySummary?.discountedRentAmount ||
      dashboard.monthlySummary?.rentWithDiscountAmount),
  );
}

export function buildRenterDashboardViewModel(dashboard: FmzTenantDashboard): FmzRenterDashboardViewModel {
  const { ownership, rentInsight, monthlySummary, boleto } = dashboard;

  const ownershipPercentage = normalizePercentage(ownership?.currentPercentage);
  const { totalPropertyValue, currentOwnedValue, amountRemainingToFullOwnership } =
    resolveOwnershipAmounts(ownership, ownershipPercentage);
  const { currentRentAmount, originalRentAmount, monthlySavings, yearlySavings } =
    resolveRentAmounts(rentInsight, monthlySummary);
  const { nextMilestonePercentage, nextMilestoneRemaining, nextMilestoneProgressPercentage, estimatedNextReduction } =
    resolveNextMilestoneCalcs(resolveNextMilestone(dashboard), ownershipPercentage, totalPropertyValue, currentOwnedValue);

  const totalDueAmount = boleto?.amount ?? monthlySummary?.totalDueAmount ?? 0;
  const dueDate        = boleto?.dueDate ?? monthlySummary?.dueDate ?? null;

  return {
    renterName:                   dashboard.tenant?.name || DEFAULT_RENTER_NAME,
    referenceMonthLabel:          formatDateBR(dashboard.competence?.label ?? dashboard.competence?.month, DEFAULT_REFERENCE_MONTH),
    ownershipPercentage,
    ownershipPercentageLabel:     formatPercentage(ownershipPercentage),
    monthlySavingsLabel:          formatCurrency(monthlySavings),
    yearlySavingsLabel:           formatCurrency(yearlySavings),
    acquiredTokensLabel:          formatCurrency(currentOwnedValue),
    acquiredTokensNumber:         currentOwnedValue,
    remainingToOwnLabel:          formatCurrency(amountRemainingToFullOwnership),
    remainingToOwnNumber:         amountRemainingToFullOwnership,
    propertyValueNumber:          totalPropertyValue,
    nextMilestonePercentage,
    nextMilestoneLabel:           formatPercentage(nextMilestonePercentage),
    nextMilestoneRemainingLabel:  formatCurrency(nextMilestoneRemaining),
    nextMilestoneRemainingNumber: nextMilestoneRemaining,
    nextMilestoneProgressPercentage,
    nextMilestoneRentReductionLabel: formatCurrency(estimatedNextReduction),
    nextMilestoneGapLabel:        formatPercentagePoints(Math.max(nextMilestonePercentage - ownershipPercentage, 0)),
    ownershipVisualPosition:      normalizePercentage(ownershipPercentage),
    journeyMilestones:            buildJourneyMilestones(ownershipPercentage, nextMilestonePercentage, totalPropertyValue),
    currentRentLabel:             formatCurrency(currentRentAmount),
    currentRentNumber:            currentRentAmount,
    originalRentLabel:            formatCurrency(originalRentAmount),
    originalRentNumber:           originalRentAmount,
    rentPaidPercentage:           originalRentAmount > 0 ? normalizePercentage((currentRentAmount / originalRentAmount) * 100) : 0,
    rentCopy:                     'Seus tokens já reduzem o aluguel. Comprar mais tokens aumenta sua participação e melhora esse desconto.',
    tokenBalance:                 Math.max(ownership?.tokenBalance ?? 0, 0),
    totalTokenSupply:             Math.max(ownership?.totalSupply ?? 0, 0),
    tokenUnitValue:               Math.max(ownership?.tokenUnitValue ?? 0, 0),
    baseRentForSimulation:        originalRentAmount,
    invoice: {
      totalLabel:   formatCurrency(totalDueAmount),
      dueDateLabel: formatDateBR(dueDate, '-'),
      daysUntilDue: computeDaysUntilDue(dueDate),
      paymentUrl:   boleto?.downloadUrl,
      lines:        buildInvoiceLinesFromSummary(monthlySummary),
    },
  };
}
