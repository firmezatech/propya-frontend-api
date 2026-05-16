import type { FmzTenantDashboard, FmzTenantMonthlySummary } from '../../../features/tenant-portal/domain/fmz-tenant-portal.types';
import type { FmzRenterDashboardViewModel } from './fmz-renter-dashboard.types';

const DEFAULT_RENTER_NAME = 'Diana';
const DEFAULT_REFERENCE_MONTH = 'Dezembro 2025';
const DEFAULT_NEXT_MILESTONE_PERCENTAGE = 10;

const JOURNEY_MILESTONES = [
  { percentage: 0, visualPosition: 0, caption: 'início' },
  { percentage: 5, visualPosition: 22, caption: 'alcançado' },
  { percentage: 10, visualPosition: 44, caption: 'próxima meta' },
  { percentage: 25, visualPosition: 58, caption: '1/4 do imóvel' },
  { percentage: 50, visualPosition: 72, caption: 'meio caminho' },
  { percentage: 75, visualPosition: 86, caption: 'reta final' },
  { percentage: 100, visualPosition: 100, caption: 'casa própria' },
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

function parseBrazilianCurrency(value?: string | null): number {
  if (!value) return 0;
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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

function getJourneyVisualPosition(percentage: number): number {
  const value = normalizePercentage(percentage);

  for (let index = 0; index < JOURNEY_MILESTONES.length - 1; index += 1) {
    const currentMilestone = JOURNEY_MILESTONES[index];
    const nextMilestone = JOURNEY_MILESTONES[index + 1];

    if (value >= currentMilestone.percentage && value <= nextMilestone.percentage) {
      const ratio = (value - currentMilestone.percentage) / (nextMilestone.percentage - currentMilestone.percentage);
      return currentMilestone.visualPosition + ratio * (nextMilestone.visualPosition - currentMilestone.visualPosition);
    }
  }

  return 100;
}

function buildJourneyMilestones(ownershipPercentage: number, nextMilestonePercentage: number) {
  return JOURNEY_MILESTONES.map((milestone) => ({
    percentage: milestone.percentage,
    label: `${numberFormatter.format(milestone.percentage)}%`,
    caption: milestone.caption,
    visualPosition: milestone.visualPosition,
    status: milestone.percentage < ownershipPercentage
      ? 'done' as const
      : milestone.percentage === nextMilestonePercentage
        ? 'next' as const
        : 'future' as const,
  }));
}

function buildInvoiceLinesFromSummary(summary: FmzTenantMonthlySummary | null | undefined): FmzRenterDashboardViewModel['invoice']['lines'] {
  if (!summary) return [];

  if (summary.lines && summary.lines.length > 0) {
    return summary.lines.map((line) => ({
      key: line.key,
      label: line.label,
      value: formatCurrency(line.amount),
      tone: line.key === 'current-rent' || line.key === 'rent-with-discount' ? 'success' as const
        : line.key === 'scheduled-token-purchase' || line.key === 'token-purchase' ? 'warning' as const
        : undefined,
    }));
  }

  const lines: FmzRenterDashboardViewModel['invoice']['lines'] = [];
  const rentWithDiscount = summary.rentWithDiscountAmount ?? 0;
  const adminFee = summary.rentalAdminFeeAmount ?? 0;
  const condominium = summary.condominiumAmount ?? 0;
  const tokenPurchase = summary.scheduledTokenPurchaseAmount ?? 0;
  const tokenFee = summary.tokenPurchaseFeeAmount ?? 0;

  lines.push({ key: 'current-rent', label: 'Aluguel com desconto', value: formatCurrency(rentWithDiscount), tone: 'success' });

  if (adminFee > 0) {
    lines.push({ key: 'rent-fee', label: 'Taxa Adm Aluguel', value: formatCurrency(adminFee) });
  }
  if (condominium > 0) {
    lines.push({ key: 'condominium', label: 'Condomínio', value: formatCurrency(condominium) });
  }
  if (tokenPurchase > 0) {
    lines.push({ key: 'scheduled-token-purchase', label: 'Compra programada de tokens', value: formatCurrency(tokenPurchase), tone: 'warning' });
  }
  if (tokenFee > 0) {
    lines.push({ key: 'token-purchase-fee', label: 'Taxa de compra de tokens', value: formatCurrency(tokenFee) });
  }

  return lines;
}

export function hasRenterDashboardData(dashboard: FmzTenantDashboard | null): boolean {
  return Boolean(
    dashboard &&
    typeof dashboard.ownership?.currentPercentage === 'number' &&
    (dashboard.rentInsight?.currentRentAmount || dashboard.monthlySummary?.rentWithDiscountAmount),
  );
}

export function buildRenterDashboardViewModel(dashboard: FmzTenantDashboard): FmzRenterDashboardViewModel {
  const { ownership, nextGoal, rentInsight, monthlySummary, boleto } = dashboard;

  const ownershipPercentage = normalizePercentage(ownership?.currentPercentage);
  const totalPropertyValue = ownership?.totalPropertyValue ?? 0;
  const currentOwnedValue = ownership?.currentOwnedValue ?? (totalPropertyValue * ownershipPercentage / 100);
  const amountRemainingToFullOwnership = ownership?.amountRemainingToFullOwnership ?? Math.max(totalPropertyValue - currentOwnedValue, 0);

  const originalRentAmount = rentInsight?.originalRentAmount ?? monthlySummary?.originalRentAmount ?? 0;
  const currentRentAmount = rentInsight?.currentRentAmount ?? monthlySummary?.rentWithDiscountAmount ?? originalRentAmount;
  const monthlySavings = rentInsight?.monthlySavingsAmount ?? Math.max(originalRentAmount - currentRentAmount, 0);
  const yearlySavings = rentInsight?.annualSavingsAmount ?? (monthlySavings * 12);

  const nextMilestonePercentage = nextGoal?.percentage != null
    ? normalizePercentage(nextGoal.percentage)
    : Math.max(DEFAULT_NEXT_MILESTONE_PERCENTAGE, Math.ceil(ownershipPercentage / 5) * 5);
  const nextMilestoneTotal = nextGoal?.goalValue ?? (totalPropertyValue * (nextMilestonePercentage / 100));
  const nextMilestoneRemaining = nextGoal?.amountNeeded ?? Math.max(nextMilestoneTotal - currentOwnedValue, 0);
  const nextMilestoneProgressPercentage = nextGoal?.progressToGoalPercentage != null
    ? normalizePercentage(nextGoal.progressToGoalPercentage)
    : (nextMilestoneTotal > 0 ? normalizePercentage((currentOwnedValue / nextMilestoneTotal) * 100) : 0);
  const nextMilestoneGap = Math.max(nextMilestonePercentage - ownershipPercentage, 0);
  const estimatedNextReduction = nextGoal?.estimatedMonthlyRentReduction ?? (originalRentAmount * nextMilestoneGap / 100);

  const rentPaidPercentage = originalRentAmount > 0 ? normalizePercentage((currentRentAmount / originalRentAmount) * 100) : 0;
  const totalDueAmount = monthlySummary?.totalDueAmount ?? 0;

  return {
    renterName: dashboard.tenant?.name || DEFAULT_RENTER_NAME,
    referenceMonthLabel: dashboard.competence?.label ?? dashboard.competence?.month ?? DEFAULT_REFERENCE_MONTH,
    ownershipPercentage,
    ownershipPercentageLabel: formatPercentage(ownershipPercentage),
    monthlySavingsLabel: formatCurrency(monthlySavings),
    yearlySavingsLabel: formatCurrency(yearlySavings),
    acquiredTokensLabel: formatCurrency(currentOwnedValue),
    acquiredTokensNumber: currentOwnedValue,
    remainingToOwnLabel: formatCurrency(amountRemainingToFullOwnership),
    remainingToOwnNumber: amountRemainingToFullOwnership,
    propertyValueNumber: totalPropertyValue,
    nextMilestonePercentage,
    nextMilestoneLabel: formatPercentage(nextMilestonePercentage),
    nextMilestoneRemainingLabel: formatCurrency(nextMilestoneRemaining),
    nextMilestoneRemainingNumber: nextMilestoneRemaining,
    nextMilestoneProgressPercentage,
    nextMilestoneRentReductionLabel: formatCurrency(estimatedNextReduction),
    nextMilestoneGapLabel: formatPercentagePoints(nextMilestoneGap),
    ownershipVisualPosition: getJourneyVisualPosition(ownershipPercentage),
    journeyMilestones: buildJourneyMilestones(ownershipPercentage, nextMilestonePercentage),
    currentRentLabel: formatCurrency(currentRentAmount),
    currentRentNumber: currentRentAmount,
    originalRentLabel: formatCurrency(originalRentAmount),
    originalRentNumber: originalRentAmount,
    rentPaidPercentage,
    rentCopy: 'Seus tokens já reduzem o aluguel. Comprar mais tokens aumenta sua participação e melhora esse desconto.',
    invoice: {
      totalLabel: formatCurrency(totalDueAmount),
      dueDateLabel: monthlySummary?.dueDate ?? '-',
      paymentUrl: boleto?.downloadUrl,
      lines: buildInvoiceLinesFromSummary(monthlySummary),
    },
  };
}
