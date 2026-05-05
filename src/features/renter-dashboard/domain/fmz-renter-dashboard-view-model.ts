import type { InvoiceData, PropertyData, RentDetailData } from '../../../services/web3-api';
import type { FmzRenterDashboardViewModel } from './fmz-renter-dashboard.types';

const DEFAULT_RENTER_NAME = 'Diana';
const DEFAULT_REFERENCE_MONTH = 'Dezembro 2025';
const DEFAULT_NEXT_MILESTONE_PERCENTAGE = 10;

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

function getOriginalRentNumber(rentDetail: RentDetailData): number {
  return parseBrazilianCurrency(rentDetail.currentRentValue || rentDetail.initialRentValue);
}

function getCurrentRentNumber(rentDetail: RentDetailData, invoiceData?: InvoiceData | null): number {
  return invoiceData?.currentRentAsOwnerValueNumber || parseBrazilianCurrency(rentDetail.currentRentAsOwnerValue);
}

function buildInvoiceLines(invoiceData: InvoiceData | null, rentDetail: RentDetailData): FmzRenterDashboardViewModel['invoice']['lines'] {
  if (!invoiceData) {
    return [
      { key: 'current-rent', label: 'Aluguel com desconto', value: rentDetail.currentRentAsOwnerValue, tone: 'success' },
      { key: 'rent-fee', label: 'Taxa Adm Aluguel', value: rentDetail.valueRentFee },
      { key: 'condominium', label: 'Condomínio', value: rentDetail.condoFee },
      { key: 'scheduled-token-purchase', label: 'Compra programada de tokens', value: rentDetail.tokensToBuyCurrency, tone: 'warning' },
      { key: 'token-purchase-fee', label: 'Taxa de compra de tokens', value: rentDetail.tokensToBuyCurrencyFee },
    ];
  }

  const lines: FmzRenterDashboardViewModel['invoice']['lines'] = [
    { key: 'current-rent', label: 'Aluguel com desconto', value: invoiceData.currentRentAsOwnerValue, tone: 'success' },
    { key: 'rent-fee', label: 'Taxa Adm Aluguel', value: invoiceData.rentValueFee },
    { key: 'condominium', label: 'Condomínio', value: invoiceData.condoFee },
  ];

  if (invoiceData.propertyTax > 0) {
    lines.push({ key: 'property-tax', label: 'IPTU', value: invoiceData.propertyTaxCurrency });
  }

  lines.push(
    { key: 'scheduled-token-purchase', label: 'Compra programada de tokens', value: invoiceData.tokensToBuyCurrency, tone: 'warning' },
    { key: 'token-purchase-fee', label: 'Taxa de compra de tokens', value: invoiceData.tokensToBuyFee },
  );

  if (invoiceData.maintenanceAsOwnerNumber > 0) {
    lines.push({ key: 'maintenance', label: 'Manutenção', value: invoiceData.maintenanceAsOwnerValue });
  }

  return lines;
}

export function hasRenterDashboardData(propertyDetail: PropertyData | null, rentDetail: RentDetailData | null): boolean {
  return Boolean(
    propertyDetail &&
    rentDetail &&
    typeof propertyDetail.percentageBuyerNumber === 'number' &&
    rentDetail.currentRentAsOwnerValue &&
    rentDetail.currentRentValue
  );
}

export function buildRenterDashboardViewModel(params: {
  propertyDetail: PropertyData;
  rentDetail: RentDetailData;
  invoiceData: InvoiceData | null;
  renterName?: string | null;
  referenceMonthLabel?: string | null;
}): FmzRenterDashboardViewModel {
  const { propertyDetail, rentDetail, invoiceData } = params;
  const ownershipPercentage = normalizePercentage(propertyDetail.percentageBuyerNumber);
  const nextMilestonePercentage = Math.max(DEFAULT_NEXT_MILESTONE_PERCENTAGE, Math.ceil(ownershipPercentage / 5) * 5);
  const currentRentNumber = getCurrentRentNumber(rentDetail, invoiceData);
  const originalRentNumber = getOriginalRentNumber(rentDetail);
  const monthlySavings = Math.max(originalRentNumber - currentRentNumber, 0);
  const yearlySavings = monthlySavings * 12;
  const acquiredTokens = propertyDetail.propertyValue * (ownershipPercentage / 100);
  const remainingToOwn = Math.max(propertyDetail.propertyValue - acquiredTokens, 0);
  const nextMilestoneTotal = propertyDetail.propertyValue * (nextMilestonePercentage / 100);
  const nextMilestoneRemaining = Math.max(nextMilestoneTotal - acquiredTokens, 0);
  const nextMilestoneProgressPercentage = nextMilestoneTotal > 0 ? normalizePercentage((acquiredTokens / nextMilestoneTotal) * 100) : 0;
  const rentPaidPercentage = originalRentNumber > 0 ? normalizePercentage((currentRentNumber / originalRentNumber) * 100) : 0;
  const estimatedNextReduction = originalRentNumber * Math.max(nextMilestonePercentage - ownershipPercentage, 0) / 100;

  return {
    renterName: params.renterName || DEFAULT_RENTER_NAME,
    referenceMonthLabel: params.referenceMonthLabel || DEFAULT_REFERENCE_MONTH,
    ownershipPercentage,
    ownershipPercentageLabel: formatPercentage(ownershipPercentage),
    monthlySavingsLabel: formatCurrency(monthlySavings),
    yearlySavingsLabel: formatCurrency(yearlySavings),
    acquiredTokensLabel: formatCurrency(acquiredTokens),
    remainingToOwnLabel: formatCurrency(remainingToOwn),
    nextMilestonePercentage,
    nextMilestoneLabel: formatPercentage(nextMilestonePercentage),
    nextMilestoneRemainingLabel: formatCurrency(nextMilestoneRemaining),
    nextMilestoneProgressPercentage,
    nextMilestoneRentReductionLabel: formatCurrency(estimatedNextReduction),
    currentRentLabel: invoiceData?.currentRentAsOwnerValue || rentDetail.currentRentAsOwnerValue,
    originalRentLabel: rentDetail.currentRentValue || rentDetail.initialRentValue,
    rentPaidPercentage,
    rentCopy: 'Seus tokens já reduzem o aluguel. Comprar mais tokens aumenta sua participação e melhora esse desconto.',
    invoice: {
      totalLabel: invoiceData?.totalInvoice || rentDetail.totalValuesMonthly,
      dueDateLabel: invoiceData?.dueDate || rentDetail.nextDatePaymentRent,
      paymentUrl: invoiceData?.path,
      lines: buildInvoiceLines(invoiceData, rentDetail),
    },
  };
}
