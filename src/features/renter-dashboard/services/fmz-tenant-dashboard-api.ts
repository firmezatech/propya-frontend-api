import { firmezaApiClient } from '../../../services/firmeza-api-client';
import type { InvoiceData, PropertyData, RentDetailData } from '../../../services/web3-api';

type UnknownRecord = Record<string, unknown>;

export type FmzTenantDashboardApiResponse = {
  propertyDetail: PropertyData;
  rentDetail: RentDetailData;
  invoiceData: InvoiceData | null;
  renterName: string | null;
  referenceMonthLabel: string | null;
  propertyId: string | null;
};

const recordOf = (value: unknown): UnknownRecord => (value && typeof value === 'object' ? value as UnknownRecord : {});

const firstRecord = (...values: unknown[]): UnknownRecord => {
  for (const value of values) {
    const record = recordOf(value);
    if (Object.keys(record).length > 0) return record;
  }

  return {};
};

const str = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

const nullableStr = (value: unknown): string | null => {
  const parsed = str(value);
  return parsed || null;
};

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const normalized = value
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
};

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const formatMoney = (value: number): string => moneyFormatter.format(Math.max(value, 0));
const formatPercent = (value: number): string => `${percentFormatter.format(Math.max(value, 0))}%`;

const pick = (record: UnknownRecord, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }

  return undefined;
};

const buildPropertyDetail = (payload: UnknownRecord, property: UnknownRecord, rent: UnknownRecord, tenant: UnknownRecord): PropertyData => {
  const ownershipPercentage = num(
    pick(
      property,
      'percentageBuyerNumber',
      'ownershipPercentage',
      'ownership_percent',
      'tenantOwnershipPercentage',
      'tenant_ownership_percentage',
      'percentageBuyer',
    ),
    num(pick(rent, 'percentBuyer', 'percent_buyer'), num(pick(tenant, 'ownershipPercentage', 'ownership_percent'), 0)),
  );

  const propertyValue = num(pick(property, 'propertyValue', 'property_value', 'value'), num(pick(payload, 'propertyValue', 'property_value'), 0));
  const acquiredValue = propertyValue * (ownershipPercentage / 100);
  const remainingValue = Math.max(propertyValue - acquiredValue, 0);
  const propertyIdValue = pick(property, 'propertyId', 'property_id', 'id') ?? pick(payload, 'propertyId', 'property_id');

  return {
    smartContract: str(pick(property, 'smartContract', 'smart_contract')),
    attributes: Array.isArray(property.attributes) ? property.attributes as PropertyData['attributes'] : [],
    name: str(pick(property, 'name', 'propertyName', 'property_name'), 'Imóvel'),
    image: str(pick(property, 'image', 'imageUrl', 'image_url')),
    propertyId: num(propertyIdValue, 0),
    description: str(pick(property, 'description')),
    deedRegistration: str(pick(property, 'deedRegistration', 'deed_registration')),
    seller: str(pick(property, 'seller', 'owner', 'ownerName', 'owner_name')),
    fundingComplete: Boolean(pick(property, 'fundingComplete', 'funding_complete')),
    availablePurchase: Boolean(pick(property, 'availablePurchase', 'available_purchase', 'available')),
    propertyValue,
    propertyValueCurrency: str(pick(property, 'propertyValueCurrency', 'property_value_currency'), formatMoney(propertyValue)),
    totalTokens: num(pick(property, 'totalTokens', 'total_tokens'), 0),
    totalTokensNumberFormat: str(pick(property, 'totalTokensNumberFormat', 'total_tokens_number_format'), String(num(pick(property, 'totalTokens', 'total_tokens'), 0))),
    totalTokensRenterCurrency: str(pick(property, 'totalTokensRenterCurrency', 'total_tokens_renter_currency'), formatMoney(acquiredValue)),
    totalTokensRenterNumberFormat: str(pick(property, 'totalTokensRenterNumberFormat', 'total_tokens_renter_number_format'), String(acquiredValue)),
    availableTokensBuyer: num(pick(property, 'availableTokensBuyer', 'available_tokens_buyer'), remainingValue),
    availableTokensBuyerNumberFormat: str(pick(property, 'availableTokensBuyerNumberFormat', 'available_tokens_buyer_number_format'), String(remainingValue)),
    percentageBuyer: str(pick(property, 'percentageBuyer', 'percentage_buyer'), formatPercent(ownershipPercentage)),
    percentageBuyerNumber: ownershipPercentage,
    percentageBuyerTruncate: str(pick(property, 'percentageBuyerTruncate', 'percentage_buyer_truncate'), formatPercent(ownershipPercentage)),
    percentageMissing: str(pick(property, 'percentageMissing', 'percentage_missing'), formatPercent(Math.max(100 - ownershipPercentage, 0))),
    percentageMissingNumber: num(pick(property, 'percentageMissingNumber', 'percentage_missing_number'), Math.max(100 - ownershipPercentage, 0)),
    percentageMissingTruncate: str(pick(property, 'percentageMissingTruncate', 'percentage_missing_truncate'), formatPercent(Math.max(100 - ownershipPercentage, 0))),
    percentageInvestors: str(pick(property, 'percentageInvestors', 'percentage_investors'), formatPercent(num(pick(property, 'percentageInvestorsNumber', 'percentage_investors_number'), 0))),
    percentageInvestorsNumber: num(pick(property, 'percentageInvestorsNumber', 'percentage_investors_number'), 0),
    chainId: str(pick(property, 'chainId', 'chain_id')),
    blockExplorerUrl: str(pick(property, 'blockExplorerUrl', 'block_explorer_url')),
  };
};

const buildRentDetail = (propertyDetail: PropertyData, rent: UnknownRecord, invoice: UnknownRecord, tenant: UnknownRecord): RentDetailData => {
  const originalRent = num(pick(rent, 'currentRentValueNumber', 'current_rent_value_number', 'initialRentValueNumber', 'initial_rent_value_number', 'grossRentAmount', 'gross_rent_amount'), 0);
  const currentRent = num(pick(invoice, 'currentRentAsOwnerValueNumber', 'current_rent_as_owner_value_number'), num(pick(rent, 'currentRentAsOwnerValueNumber', 'current_rent_as_owner_value_number', 'rentAmountToPay', 'rent_amount_to_pay'), originalRent));
  const rentFee = num(pick(rent, 'valueRentFeeNumber', 'value_rent_fee_number'), num(pick(invoice, 'rentValueFeeNumber', 'rent_value_fee_number'), 0));
  const condoFee = num(pick(rent, 'condoFeeNumber', 'condo_fee_number'), num(pick(invoice, 'condoFeeNumber', 'condo_fee_number'), 0));
  const tokensToBuy = num(pick(rent, 'tokensToBuy', 'tokens_to_buy'), num(pick(invoice, 'tokensToBuy', 'tokens_to_buy'), 0));
  const tokenFee = num(pick(invoice, 'tokensToBuyFeeNumber', 'tokens_to_buy_fee_number'), num(pick(rent, 'tokensToBuyFeeNumber', 'tokens_to_buy_fee_number'), 0));
  const totalMonthly = num(pick(invoice, 'totalInvoiceNumber', 'total_invoice_number'), currentRent + rentFee + condoFee + tokensToBuy + tokenFee);

  return {
    admin: str(pick(rent, 'admin', 'owner')),
    renter: str(pick(rent, 'renter', 'tenantName', 'tenant_name'), str(pick(tenant, 'name', 'fullName', 'full_name'))),
    propertyId: propertyDetail.propertyId,
    percentBuyer: str(pick(rent, 'percentBuyer', 'percent_buyer'), propertyDetail.percentageBuyer),
    initialRentValue: str(pick(rent, 'initialRentValue', 'initial_rent_value'), formatMoney(originalRent)),
    currentRentValue: str(pick(rent, 'currentRentValue', 'current_rent_value'), formatMoney(originalRent)),
    currentRentAsOwnerValue: str(pick(rent, 'currentRentAsOwnerValue', 'current_rent_as_owner_value'), formatMoney(currentRent)),
    valueRentFee: str(pick(rent, 'valueRentFee', 'value_rent_fee'), formatMoney(rentFee)),
    startDate: str(pick(rent, 'startDate', 'start_date')),
    nextDatePaymentRent: str(pick(rent, 'nextDatePaymentRent', 'next_date_payment_rent'), str(pick(invoice, 'dueDate', 'due_date'), '-')),
    nextDatePaymentRentNumber: num(pick(rent, 'nextDatePaymentRentNumber', 'next_date_payment_rent_number'), num(pick(invoice, 'dueDateNumber', 'due_date_number'), 0)),
    todayNumber: num(pick(rent, 'todayNumber', 'today_number'), num(pick(invoice, 'todayNumber', 'today_number'), 0)),
    nextDateAdjustment: str(pick(rent, 'nextDateAdjustment', 'next_date_adjustment')),
    condoFee: str(pick(rent, 'condoFee', 'condo_fee'), formatMoney(condoFee)),
    tokensToBuy,
    tokensToBuyCurrency: str(pick(rent, 'tokensToBuyCurrency', 'tokens_to_buy_currency'), str(pick(invoice, 'tokensToBuyCurrency', 'tokens_to_buy_currency'), formatMoney(tokensToBuy))),
    tokensToBuyCurrencyFee: str(pick(rent, 'tokensToBuyCurrencyFee', 'tokens_to_buy_currency_fee'), str(pick(invoice, 'tokensToBuyFee', 'tokens_to_buy_fee'), formatMoney(tokenFee))),
    propertyTax: num(pick(rent, 'propertyTax', 'property_tax'), num(pick(invoice, 'propertyTax', 'property_tax'), 0)),
    propertyTaxCurrency: str(pick(rent, 'propertyTaxCurrency', 'property_tax_currency'), str(pick(invoice, 'propertyTaxCurrency', 'property_tax_currency'), formatMoney(0))),
    totalValuesMonthly: str(pick(rent, 'totalValuesMonthly', 'total_values_monthly'), str(pick(invoice, 'totalInvoice', 'total_invoice'), formatMoney(totalMonthly))),
    maintenanceExpectedCurrency: str(pick(rent, 'maintenanceExpectedCurrency', 'maintenance_expected_currency'), str(pick(invoice, 'maintenanceTotal', 'maintenance_total'), formatMoney(0))),
  };
};

const buildInvoiceData = (propertyDetail: PropertyData, invoice: UnknownRecord): InvoiceData | null => {
  if (Object.keys(invoice).length === 0) return null;

  const currentRent = num(pick(invoice, 'currentRentAsOwnerValueNumber', 'current_rent_as_owner_value_number'), num(pick(invoice, 'currentRentAsOwnerValue', 'current_rent_as_owner_value'), 0));
  const rentFee = num(pick(invoice, 'rentValueFeeNumber', 'rent_value_fee_number'), num(pick(invoice, 'rentValueFee', 'rent_value_fee'), 0));
  const condoFee = num(pick(invoice, 'condoFeeNumber', 'condo_fee_number'), num(pick(invoice, 'condoFee', 'condo_fee'), 0));
  const tokensToBuy = num(pick(invoice, 'tokensToBuy', 'tokens_to_buy'), 0);
  const tokenFee = num(pick(invoice, 'tokensToBuyFeeNumber', 'tokens_to_buy_fee_number'), num(pick(invoice, 'tokensToBuyFee', 'tokens_to_buy_fee'), 0));
  const propertyTax = num(pick(invoice, 'propertyTax', 'property_tax'), 0);
  const maintenance = num(pick(invoice, 'maintenanceAsOwnerNumber', 'maintenance_as_owner_number'), 0);
  const total = num(pick(invoice, 'totalInvoiceNumber', 'total_invoice_number'), currentRent + rentFee + condoFee + tokensToBuy + tokenFee + propertyTax + maintenance);

  return {
    invoiceId: num(pick(invoice, 'invoiceId', 'invoice_id', 'id'), 0),
    propertyId: propertyDetail.propertyId,
    dueDate: str(pick(invoice, 'dueDate', 'due_date'), '-'),
    dueDateNumber: num(pick(invoice, 'dueDateNumber', 'due_date_number'), 0),
    todayNumber: num(pick(invoice, 'todayNumber', 'today_number'), 0),
    paymentDate: str(pick(invoice, 'paymentDate', 'payment_date')),
    currentRentAsOwnerValue: str(pick(invoice, 'currentRentAsOwnerValue', 'current_rent_as_owner_value'), formatMoney(currentRent)),
    currentRentAsOwnerValueNumber: currentRent,
    rentValueFee: str(pick(invoice, 'rentValueFee', 'rent_value_fee'), formatMoney(rentFee)),
    rentValueFeeNumber: rentFee,
    condoFee: str(pick(invoice, 'condoFee', 'condo_fee'), formatMoney(condoFee)),
    condoFeeNumber: condoFee,
    tokensToBuy,
    tokensToBuyCurrency: str(pick(invoice, 'tokensToBuyCurrency', 'tokens_to_buy_currency'), formatMoney(tokensToBuy)),
    tokensToBuyFee: str(pick(invoice, 'tokensToBuyFee', 'tokens_to_buy_fee'), formatMoney(tokenFee)),
    tokensToBuyFeeNumber: tokenFee,
    propertyTax,
    propertyTaxCurrency: str(pick(invoice, 'propertyTaxCurrency', 'property_tax_currency'), formatMoney(propertyTax)),
    maintenanceAsOwnerValue: str(pick(invoice, 'maintenanceAsOwnerValue', 'maintenance_as_owner_value'), formatMoney(maintenance)),
    maintenanceAsOwnerNumber: maintenance,
    maintenanceTotal: str(pick(invoice, 'maintenanceTotal', 'maintenance_total'), formatMoney(maintenance)),
    percentBuyer: str(pick(invoice, 'percentBuyer', 'percent_buyer'), propertyDetail.percentageBuyer),
    penalty: num(pick(invoice, 'penalty'), 0),
    penaltyCurrency: str(pick(invoice, 'penaltyCurrency', 'penalty_currency'), formatMoney(num(pick(invoice, 'penalty'), 0))),
    interest: num(pick(invoice, 'interest'), 0),
    interestCurrency: str(pick(invoice, 'interestCurrency', 'interest_currency'), formatMoney(num(pick(invoice, 'interest'), 0))),
    earlyDays: num(pick(invoice, 'earlyDays', 'early_days'), 0),
    delayDays: num(pick(invoice, 'delayDays', 'delay_days'), 0),
    status: num(pick(invoice, 'status'), 0),
    statusDescription: str(pick(invoice, 'statusDescription', 'status_description')),
    invoiceType: num(pick(invoice, 'invoiceType', 'invoice_type'), 0),
    invoiceTypeDescription: str(pick(invoice, 'invoiceTypeDescription', 'invoice_type_description')),
    totalInvoice: str(pick(invoice, 'totalInvoice', 'total_invoice'), formatMoney(total)),
    path: nullableStr(pick(invoice, 'path', 'paymentUrl', 'payment_url', 'boletoUrl', 'boleto_url', 'boletoPdfUrl', 'boleto_pdf_url')),
    statusBD: num(pick(invoice, 'statusBD', 'status_bd'), 0),
    cancellationDate: str(pick(invoice, 'cancellationDate', 'cancellation_date')),
    cancellationReason: str(pick(invoice, 'cancellationReason', 'cancellation_reason')),
  };
};

export async function getTenantDashboardData(propertyId?: string | null): Promise<FmzTenantDashboardApiResponse> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
  const { data } = await firmezaApiClient.get(`/tenant/dashboard${query}`);

  const root = recordOf(data);
  const payload = firstRecord(root.data, root.dashboard, root.result, root);
  const property = firstRecord(payload.propertyDetail, payload.property, payload.propertyData, payload.property_detail, payload.property_data);
  const rent = firstRecord(payload.rentDetail, payload.rent, payload.rentData, payload.rent_detail, payload.rent_data);
  const invoice = firstRecord(payload.invoiceData, payload.invoice, payload.currentInvoice, payload.current_invoice, payload.boleto);
  const tenant = firstRecord(payload.tenant, payload.renter, payload.user, root.user);
  const propertyDetail = buildPropertyDetail(payload, property, rent, tenant);
  const rentDetail = buildRentDetail(propertyDetail, rent, invoice, tenant);
  const invoiceData = buildInvoiceData(propertyDetail, invoice);

  return {
    propertyDetail,
    rentDetail,
    invoiceData,
    renterName: nullableStr(pick(payload, 'renterName', 'tenantName', 'tenant_name')) ?? nullableStr(pick(tenant, 'name', 'fullName', 'full_name')),
    referenceMonthLabel: nullableStr(pick(payload, 'referenceMonthLabel', 'reference_month_label', 'referenceMonth', 'reference_month')),
    propertyId: nullableStr(pick(property, 'id', 'propertyId', 'property_id')) ?? nullableStr(pick(payload, 'propertyId', 'property_id')),
  };
}
