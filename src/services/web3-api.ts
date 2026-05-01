import axios, { AxiosError } from 'axios';
import { authenticatedFirmezaFetch, firmezaApiClient } from './firmeza-api-client';

import {truncPercentActual, truncPercentMissing} from "./format";

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class APICache {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static TTL = 5 * 60 * 1000; // 5 minutes default TTL

  static generateKey(functionName: string, params?: any): string {
    return `${functionName}:${JSON.stringify(params || {})}`;
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static invalidate(pattern?: string): void {
    if (pattern) {
      // Delete specific pattern using Array.from to handle the iterator
      Array.from(this.cache.keys()).forEach(key => {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      // Clear entire cache
      this.cache.clear();
    }
  }

  static invalidateAll(): void {
    this.cache.clear();
  }
}


// Cache simples para perfis de investidores
const profileCache = new Map<string, number>();

// Função para limpar o cache de perfis
export const clearProfileCache = () => {
  profileCache.clear();
  console.log('🧹 Cache de perfis limpo');
};

const Profile = {
  ADMIN: 0,
  SELLER: 1,
  RENTER: 2,
  INVESTOR: 3,
  LEGACY: 4,
  FMZ: 5,
};

export function getStatusProfile(profile: number, t: (key: string) => string) {
  switch (profile) {
    case Profile.ADMIN: return t('ADMIN');
    case Profile.SELLER: return t('SELLER');
    case Profile.RENTER: return t('RENTER');
    case Profile.INVESTOR: return t('INVESTOR');
    case Profile.LEGACY: return t('LEGACY');
    case Profile.FMZ: return t('FMZ');
    default: return "";
  }
}

export type Attribute = {
  trait_type: string;
  value: string;
};

export type PropertyData = {
  smartContract: string;
  //ownerContract: string;
  attributes: Attribute[];
  name: string;
  image: string;
  propertyId: number;
  description: string;
  deedRegistration: string;
  seller: string;
  fundingComplete: boolean;
  availablePurchase: boolean;
  propertyValue: number;
  propertyValueCurrency: string;
  totalTokens: number;
  totalTokensNumberFormat: string;
  totalTokensRenterCurrency: string;
  totalTokensRenterNumberFormat: string;
  //totalTokensInvestorsNumberFormat: string;
  //availableTokensInvestors: number;
  //availableTokensInvestorsNumberFormat: string;
  availableTokensBuyer: number;
  availableTokensBuyerNumberFormat: string;
  percentageBuyer: string;
  percentageBuyerNumber: number;
  percentageBuyerTruncate: string;
  percentageMissing: string;
  percentageMissingNumber: number;
  percentageMissingTruncate: string;
  percentageInvestors: string;
  percentageInvestorsNumber: number;
  chainId: string;
  blockExplorerUrl: string;
};

export type RentDetailData = {
  admin: string;
  renter: string;
  propertyId: number;
  percentBuyer: string;
  initialRentValue: string;
  currentRentValue: string;
  currentRentAsOwnerValue: string;
  valueRentFee: string;
  startDate: string;
  nextDatePaymentRent: string;
  nextDatePaymentRentNumber: number;
  todayNumber: number;
  nextDateAdjustment: string;
  condoFee: string;
  tokensToBuy: number;
  tokensToBuyCurrency: string;
  tokensToBuyCurrencyFee: string;
  propertyTax: number;
  propertyTaxCurrency: string;
  totalValuesMonthly: string;
  maintenanceExpectedCurrency: string;
};

export type InvestorData = {
  investorAddress: string;
  propertyId: number;
  initTokensPercentNumber: number;
  initTokensPercentFormat: string;
  initRentValue: number;
  initRentValueCurrency: string;
  propertyTokens: number;
  propertyTokensCurrentFormat: string;
  propertyTokensCurrency: string;
  rentYield: string;
  rentYieldFee: string;
  nextRentPayment: number;
  nextRentPaymentCurrency: string;
  calcNextRentPaymentFee: number;
  calcNextRentPaymentFeeCurrency: string;
  capitalValue: string;
  capitalValueNumberFormat: string;
  expectedTokensPurchase: number;
  expectedTokensPurchaseCurrency: string;
  rePurchasedTokensCurrency: string;
  rePurchasedTokensNumber: number;
  rePurchasedTokensNumberFormat: string;
  rePurchasedTokensPercent: number;
  rePurchasedTokensPercentFormat: string;
  rePurchasedTokensPercentMissing: number;
  rePurchasedTokensPercentMissingFormat: string;
  percentageInvested: string;
  percentageInvestedNumber: number;
  profile: number;
  totalMonthly: string;
  totalInvestors: number;
  maintenanceExpectedCurrency: string;
};

export type TokensPurchasedType = {
  buyer: string;
  propertyId: number;
  tokenAmount: number;
  tokenAmountFormat: string;
  capitalValue: number;
  capitalValueFormat: string;
  buyerPercent: number;
  buyerPercentFormat: string;
  missingBuyer: number;
  missingBuyerFormat: string;
  missingBuyerCurrency: string;
  date: string;
  dateNumber: number;
  runningTotal: number;
  runningTotalFormat: string;
};

export type TokensRePurchasedType = {
  seller: string;
  propertyId: number;
  tokensPurchased: number;
  date: string;
  dateNumber: number;
};

export type InvestorAndTokensType = {
  propertyId: number;
  investor: string;
  receiptDateNumber: number;
  receiptDate: string;
  totalValue: string;
  tokensRepurchased: string;
  tokensRemainingNumber: number;
  tokensRemaining: string;
  transactionValue: string;
  currentParticipation: string;
}

// export type RentalPaymentReceivedType = {
//   propertyId: number;
//   amount: string;
//   amountRenter: string;
//   condo: string;
//   invoiceId: number;
//   maintenanceValue: string;
//   totalMonthly: string;
//   datePaymentRentExpected: string;
//   datePaymentRent: string;
// };

export type RentAdjustmentType = {
  admin: string;
  propertyId: number;
  initRentValue: string;
  currentRentValue: string;
  percentAdjustment: string;
  newRentValue: string;
  tokensPurchased: number;
  date: string;
  dateTimestamp: number;
  percentPurchased: string;
  totalCumulative: number;
  totalCumulativeFormatted: string;
  missingBuyer: number;
  missingBuyerFormatted: string;
  missingBuyerCurrency: string;
};

export type DistributionRentType = {
  propertyId: number;
  investor: string;
  amount: string;
  amountFee: string;
  fee: string;
  maintenanceDiscount: string;
  valueDiscount: string;
  invoiceId: number;
  dateExpected: string;
  date: string;
};

export type DistributionRentAndTokensType = {
  propertyId: number;
  investor: string;
  profile: number;
  profileDescription: string;
  amountOriginal: string;
  amount: string;
  amountFee: string;
  fee: string;
  maintenanceDiscount: string;
  valueDiscount: string;
  rentYieldFMZ: string;
  invoiceId: number;
  tokensRepurchased: number;
  tokensRepurchasedNumber: string;
  tokensRepurchasedCurrency: string;
  totalValue: string;
  tokensRemainingNumber: number;
  tokensRemaining: string;
  tokensInvested: number;
  tokensInvestedFormatted: string;
  currentParticipation: string;
  dateExpected: string;
  dateExpectedNumber: number;
  date: string;
  dateNumber: number;
  type: string;
};

export type InvestorJoinedType = {
  propertyId: number;
  investor: string;
  tokensInvested: string;
  capitalValue: string;
  date: string;
};

export type FeeType = {
  purchaseTenantCurrency: string;
  distrRentCurrency: string;
  fmzYieldCurrency: String;
  valueCurrency: string;
  date: string;
  invoiceId: number;
  totalValueCurrency: number;
};

export type InvoiceBD = {
  invoiceId: number;
  status: number;
  path: string;
}

export type InvoiceData = {
  invoiceId: number;
  propertyId: number;
  dueDate: string;
  dueDateNumber: number;
  todayNumber: number;
  paymentDate: string;
  currentRentAsOwnerValue: string;
  currentRentAsOwnerValueNumber: number;
  rentValueFee: string;
  rentValueFeeNumber: number;
  condoFee: string;
  condoFeeNumber: number;
  tokensToBuy: number;
  tokensToBuyCurrency: string;
  tokensToBuyFee: string;
  tokensToBuyFeeNumber: number;
  propertyTax: number;
  propertyTaxCurrency: string;
  maintenanceAsOwnerValue: string;
  maintenanceAsOwnerNumber: number;
  maintenanceTotal: string;
  percentBuyer: string;
  penalty: number;
  penaltyCurrency: string;
  interest: number;
  interestCurrency: string;
  earlyDays: number;
  delayDays: number;
  status: number;
  statusDescription: string;
  invoiceType: number;
  invoiceTypeDescription: string;
  totalInvoice: string;
  cancellationDate?: string;
  cancellationReason?: string;
  path?: string | null;
  statusBD?: number | null;
};

export type MaintenanceData = {
  maintenanceId: number;
  propertyId: number;
  descriptionItem: string;
  resolutionItem: string;    
  metadataItem: string;
  priceResolution: string;
  nextDatePaymentRent: string;
  dateCreated: string;
  invoiceId: number;
  cancelled: boolean;
  maintenanceAsOwner: string;
  maintenanceDiscountCo: string;
  percentageInvest: string;
  percentBuyer: string;
  cancellationReason: string;
}

export type InvestmentGoalType = {
  totalValue: number;
  totalValueCurrency: string;
  currentPercentage: number;
  currentPercentageFormatted: string,
  currentValue: number;
  currentValueCurrency: string;
  nextGoalPercentage: number;
  nextGoalValue: number;
  nextGoalValueCurrency: string;
  amountNeeded: number;
  amountNeededCurrency: string;  
};

export type MaintenanceExpectedType = {
  propertyId: string;
  totalMaintenances: number;
  totalMaintenanceValue: string;
  totalMaintenanceValueNumber: number;
  totalProportionalSum: string;
  totalProportionalSumNumber: number;
  investorsCount: number;
  investorsSummary: {
    investorAddress: string;
    percentageInvested: string;
    percentageInvestedNumber: number;
    totalProportionalValue: string;
    totalProportionalValueNumber: number;
    maintenanceCount: number;
  }[];
};

// Helper function to calculate totalMonthly with maintenance deduction
/**
 * Utilitárias para parsing de valores monetários brasileiros
 */
function parseBrazilianCurrency(value: string): number {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  // Remove R$, espaços e pontos, substitui vírgula por ponto
  const cleanValue = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata número para moeda brasileira
 */
function formatBrazilianCurrency(value: number): string {
  if (isNaN(value)) {
    return "R$ 0,00";
  }
  
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Parse percentual brasileiro para número
 */
function parseBrazilianPercentage(percentage: string): number {
  if (!percentage || typeof percentage !== 'string') {
    return 0;
  }
  
  // Remove %, espaços e substitui vírgula por ponto
  const cleanPercentage = percentage.replace(/[%\s]/g, '').replace(',', '.');
  const parsed = parseFloat(cleanPercentage);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Valida se a resposta da API contém dados válidos de manutenção
 */
function validateMaintenanceResponse(response: any): any[] {
  if (!response || !response.data) {
    console.warn('Resposta da API é nula ou sem dados');
    return [];
  }

  console.log('🔍 validateMaintenanceResponse - Estrutura completa da resposta:', response.data);
  console.log('🔍 validateMaintenanceResponse - Tipo dos dados:', typeof response.data);
  console.log('🔍 validateMaintenanceResponse - É array?', Array.isArray(response.data));
  
  // Verifica se os dados estão em maintenanceList ou diretamente no response.data
  if (Array.isArray(response.data.maintenanceList)) {
    console.log('🔍 Dados encontrados em response.data.maintenanceList');
    return response.data.maintenanceList;
  }
  
  if (Array.isArray(response.data)) {
    console.log('🔍 Dados encontrados diretamente em response.data');
    return response.data;
  }

  // Se não é array, tenta verificar se é um objeto com propriedades de manutenção
  if (typeof response.data === 'object' && response.data.maintenanceId) {
    console.log('🔍 Dados encontrados como objeto único');
    return [response.data];
  }

  // Verificar outras possíveis estruturas
  if (response.data.data && Array.isArray(response.data.data)) {
    console.log('🔍 Dados encontrados em response.data.data');
    return response.data.data;
  }
  
  if (response.data.result && Array.isArray(response.data.result)) {
    console.log('🔍 Dados encontrados em response.data.result');
    return response.data.result;
  }
  
  if (response.data.maintenances && Array.isArray(response.data.maintenances)) {
    console.log('🔍 Dados encontrados em response.data.maintenances');
    return response.data.maintenances;
  }

  // Verificar estrutura específica da API getMaintenanceInvestorData
  if (response.data.maintenanceInvestorData && Array.isArray(response.data.maintenanceInvestorData)) {
    console.log('🔍 Dados encontrados em response.data.maintenanceInvestorData');
    return response.data.maintenanceInvestorData;
  }

  console.warn('🔍 Formato de resposta não reconhecido. Chaves disponíveis:', Object.keys(response.data || {}));
  console.warn('🔍 Estrutura completa:', JSON.stringify(response.data, null, 2));
  return [];
}

/**
 * Valida parâmetros de entrada para funções de manutenção
 */
function validateMaintenanceParams(propertyId: number, investorAddress?: string): { isValid: boolean; errorMessage?: string } {
  if (!propertyId || typeof propertyId !== 'number' || propertyId <= 0) {
    return { isValid: false, errorMessage: 'propertyId deve ser um número positivo' };
  }

  if (investorAddress !== undefined) {
    if (!investorAddress || typeof investorAddress !== 'string' || !investorAddress.trim()) {
      return { isValid: false, errorMessage: 'investorAddress deve ser um endereço válido' };
    }

    // Validação básica de formato de endereço Ethereum
    if (!/^0x[a-fA-F0-9]{40}$/.test(investorAddress.trim())) {
      return { isValid: false, errorMessage: 'investorAddress deve ser um endereço Ethereum válido (0x + 40 caracteres hexadecimais)' };
    }
  }

  return { isValid: true };
}

function calculateTotalMonthlyWithMaintenance(totalMonthly: string, maintenanceValue: number): string {
  // Extract numeric value from totalMonthly string using utility function
  const numericValue = parseBrazilianCurrency(totalMonthly);
  
  // Subtract maintenance value
  const adjustedValue = numericValue - maintenanceValue;
  
  // Format back to currency string
  return formatBrazilianCurrency(adjustedValue);
}

export const formatDateFromTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const convertBrazilianDateToTimestamp = (date: string): number => {
  const [day, month, year] = date.split('/').map(Number);
  const timestamp = new Date(year, month - 1, day).getTime() / 1000;
  return Math.floor(timestamp);
};

export async function getProperties() {
  try {
    //console.log("🔍 Chamando getProperties API...");
    const response = await firmezaApiClient.get(`/getProperties`);

    //console.log("✅ Resposta da API getProperties:", response.data);

    if (response.status === 200) {
      // Garante que a resposta seja um array
      const properties = Array.isArray(response.data) ? response.data : [response.data];
      
      // Normaliza os dados das propriedades
      const normalizedProperties = properties.map(prop => ({
        id: prop.propertyId || prop.id || '1',
        value: prop.name || `Propriedade #${prop.propertyId || prop.id || '1'}`
      }));

      //console.log("✅ Propriedades normalizadas:", normalizedProperties);
      return normalizedProperties;
    } else {
      console.error("❌ Status inesperado da API:", response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("❌ Erro ao buscar propriedades:", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error("Unexpected error occurred.");
    }
  }
}

/**
 * Busca propriedades para administradores
 */
export async function getPropertiesAdmin(wallet?: string, profile?: number) {
  try {
    console.log("🔍 Chamando getPropertiesAdmin API...", { wallet, profile });
    
    // Usar GET como a função getProperties original
    const response = await firmezaApiClient.get(`/getProperties`, {
      params: {
        wallet,
        profile,
        isAdmin: true
      }
    });

    console.log("✅ Resposta da API getPropertiesAdmin:", response.data);

    if (response.status === 200) {
      // Garante que a resposta seja um array
      const properties = Array.isArray(response.data) ? response.data : [response.data];
      
      // Normaliza os dados das propriedades para admin
      const normalizedProperties = properties.map(prop => ({
        id: prop.propertyId || prop.id || '1',
        value: prop.name || `Propriedade #${prop.propertyId || prop.id || '1'}`,
        propertyId: prop.propertyId || prop.id || 1,
        name: prop.name,
        description: prop.description,
        propertyValue: prop.propertyValue,
        propertyValueCurrency: prop.propertyValueCurrency,
        availablePurchase: prop.availablePurchase,
        fundingComplete: prop.fundingComplete
      }));

      console.log("✅ Propriedades admin normalizadas:", normalizedProperties);
      return normalizedProperties;
    } else {
      console.error("❌ Status inesperado da API:", response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("❌ Erro ao buscar propriedades admin:", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error("Unexpected error occurred.");
    }
  }
}

export async function getPropertyDetail(
  propertyId: number
): Promise<PropertyData> {
  try {
    console.log("🔍 Chamando getPropertyDetail API para propertyId:", propertyId);
    const response = await firmezaApiClient.post(`/getPropertyDetail`, {
      propertyId,
    });

    // Check if response data is valid
    if (typeof response.data === 'string' && (
        response.data.includes('Sem metada') || 
        response.data.includes('Sem metadados') ||
        response.data.startsWith('Sem metadados para o token'))) {
      console.error("❌ Resposta inválida da API getPropertyDetail:", response.data);
      throw new Error("No metadata available for this property: " + response.data);
    }

    console.log("✅ Resposta da API getPropertyDetail:", response.data);

    if (response.status === 200) {
      const propertyData = {
        smartContract: response.data.smartContract,
        //ownerContract: response.data.ownerContract,
        propertyId: response.data.propertyId,
        propertyValue: response.data.propertyValue,
        propertyValueCurrency: response.data.propertyValueCurrency,
        seller: response.data.seller,
        totalTokens: Number(response.data.totalTokens),
        totalTokensNumberFormat: response.data.totalTokensNumberFormat,
        totalTokensRenterCurrency: response.data.totalTokensRenterCurrency,
        totalTokensRenterNumberFormat: response.data.totalTokensRenterNumberFormat,
        availableTokensBuyer: Number(response.data.availableTokensBuyer),
        availableTokensBuyerNumberFormat: response.data.availableTokensBuyerNumberFormat,
        availablePurchase: response.data.available,
        fundingComplete: response.data.fundingComplete,
        percentageBuyer: response.data.percentageBuyer,
        percentageBuyerNumber: response.data.percentageBuyerNumber,
        percentageMissing: response.data.percentageMissing,
        percentageMissingNumber: response.data.percentageMissingNumber,
        percentageMissingTruncate: truncPercentActual(response.data.percentageMissingNumber*100),
        percentageBuyerTruncate: truncPercentMissing(response.data.percentageMissingNumber*100),
        percentageInvestors: response.data.percentageInvestors,
        percentageInvestorsNumber: Number(response.data.percentageInvestorsNumber),
        description: response.data.description,
        deedRegistration: response.data.deedRegistration,
        name: response.data.name,
        image: response.data.image,
        attributes: response.data.attributes,
        chainId: response.data.chainId,
        blockExplorerUrl: response.data.blockExplorerUrl,
      };

      console.log("✅ Dados da propriedade normalizados:", propertyData);
      return propertyData;
    } else {
      console.error("❌ Status inesperado da API getPropertyDetail:", response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("❌ Erro ao buscar detalhes da propriedade:", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error("Unexpected error occurred.");
    }
  }
}

export async function getRentDetailInternal(
  propertyId: number
): Promise<RentDetailData | null> {
  try {
    console.log("🔍 Chamando getRentDetail API para propertyId:", propertyId);
    const response = await authenticatedFirmezaFetch(`/getRentDetail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ propertyId }),
    });

    if (!response.ok) {
      console.error("❌ Erro na resposta da API getRentDetail:", response.status, response.statusText);
      throw new Error("Property Not Found");
    }

    // Get the response text first to check if it's valid JSON
    const responseText = await response.text();
    //console.log("📝 Resposta raw da API getRentDetail:", responseText);

    // Check if the response is valid JSON
    if (!responseText || responseText.trim() === '' || 
        responseText.includes('Sem metada') || 
        responseText.includes('Sem metadados') ||
        responseText.startsWith('Sem metadados para o token')) {
      console.error("❌ Resposta inválida da API getRentDetail:", responseText);
      throw new Error("No metadata available for this property: " + responseText);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse da resposta JSON:", parseError);
      console.error("❌ Resposta que causou o erro:", responseText);
      throw new Error("Invalid JSON response from API");
    }

    console.log("✅ Resposta da API getRentDetail:", data);

    const rentData = {
      admin: data.owner || "",
      renter: data.renter ?? "",
      propertyId: data.propertyId,
      percentBuyer: data.percentBuyer,
      initialRentValue: data.initialRentValue,
      currentRentValue: data.currentRentValue,
      currentRentAsOwnerValue: data.currentRentAsOwnerValue,
      valueRentFee: data.valueRentFee,
      startDate: data.startDate,
      nextDatePaymentRent: data.nextDatePaymentRent,
      nextDatePaymentRentNumber: Number(data.nextDatePaymentRentNumber),
      todayNumber: Number(data.todayNumber),
      nextDateAdjustment: data.nextDateAdjustment,
      condoFee: data.condoFee,
      tokensToBuy: data.tokensToBuy,
      tokensToBuyCurrency: data.tokensToBuyCurrency,
      tokensToBuyCurrencyFee: data.tokensToBuyCurrencyFee,
      propertyTax: data.propertyTax,
      propertyTaxCurrency: data.propertyTaxCurrency,
      totalValuesMonthly: data.totalValuesMonthly,
      maintenanceExpectedCurrency: data.maintenanceSummary?.totalProportionalValue || "R$ 0,00"
    };

    console.log("✅ Dados do aluguel normalizados:", rentData);
    return rentData;
  } catch (error) {
    console.error("❌ Erro ao buscar detalhes do aluguel:", error);
    throw error;
  }
}

export async function getRentDetail(
  propertyId: number
): Promise<RentDetailData | null> {
  console.log("🔍 Chamando getRentDetail para propertyId:", propertyId);
  
  try {
    const rentDetail = await getRentDetailInternal(propertyId);
    
    if (rentDetail) {
      console.log("✅ Dados de aluguel carregados com sucesso:", rentDetail);
      return rentDetail;
    } else {
      console.warn("⚠️ Nenhum dado de aluguel encontrado para propertyId:", propertyId);
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes do aluguel:", error);
    console.error("❌ PropertyId:", propertyId);
    throw error;
  }
}

export async function getInvestorDetail(
  propertyId: number,
  investorAddress: string
): Promise<InvestorData | null> {

  try {
    console.log("🔍 Chamando getInvestorDetail API:", { propertyId, investorAddress });
    
    const response = await firmezaApiClient.post(`/getInvestorDetail`, {
      propertyId,
      investorAddress
    });

    // Check if response data is valid
    if (typeof response.data === 'string' && (
        response.data.includes('Sem metada') || 
        response.data.includes('Sem metadados') ||
        response.data.startsWith('Sem metadados para o token'))) {
      console.error("❌ Resposta inválida da API getInvestorDetail:", response.data);
      throw new Error("No metadata available for this investor: " + response.data);
    }

    console.log("✅ Resposta da API getInvestorDetail:", response.data);

    if (response.status === 200) {

      const investorData = {
        investorAddress: investorAddress,
        propertyId: propertyId,
        initTokensPercentNumber: response.data.initTokensPercentNumber,
        initTokensPercentFormat: response.data.initTokensPercentFormat,
        initRentValue: response.data.initRentValue,
        initRentValueCurrency:response.data.initRentValueCurrency,
        propertyTokens: Number(response.data.propertyTokens),
        propertyTokensCurrentFormat: response.data.propertyTokensCurrentFormat,
        propertyTokensCurrency: response.data.propertyTokensCurrency,
        rentYield: response.data.rentYield,
        rentYieldFee: response.data.rentYieldFee,
        nextRentPayment: response.data.nextRentPayment,
        nextRentPaymentCurrency: response.data.nextRentPaymentCurrency,
        calcNextRentPaymentFee: response.data.calcNextRentPaymentFee,
        calcNextRentPaymentFeeCurrency: response.data.calcNextRentPaymentFeeCurrency,
        capitalValue: response.data.capitalValue,
        capitalValueNumberFormat: response.data.profile === 4 ? (response.data.capitalValueNumberFormat*100) : response.data.capitalValueNumberFormat,
        expectedTokensPurchase: response.data.expectedTokensPurchase,
        expectedTokensPurchaseCurrency: response.data.expectedTokensPurchaseCurrency,
        rePurchasedTokensCurrency: response.data.rePurchasedTokensCurrency,
        rePurchasedTokensNumber: response.data.rePurchasedTokensNumber,
        rePurchasedTokensNumberFormat: response.data.rePurchasedTokensNumberFormat,
        rePurchasedTokensPercent: response.data.rePurchasedTokensPercent,
        rePurchasedTokensPercentFormat: response.data.rePurchasedTokensPercentFormat,
        rePurchasedTokensPercentMissing: response.data.rePurchasedTokensPercentMissing,
        rePurchasedTokensPercentMissingFormat: response.data.rePurchasedTokensPercentMissingFormat,
        percentageInvested: response.data.percentageInvested,
        percentageInvestedNumber: Number(response.data.percentageInvestedNumber),
        profile: response.data.profile,    
        totalMonthly: response.data.totalMonthly,
        totalInvestors: response.data.totalInvestors,
        maintenanceExpectedCurrency: response.data.maintenanceSummary?.totalProportionalValue || "R$ 0,00"
      };
      
      console.log("✅ Dados do investidor processados:", investorData);
      return investorData;
    } else {
      console.error("❌ Status de resposta inesperado:", response.status);
      throw new Error("Property Not Found: " + propertyId);
    }
  } catch (error) {
    console.error("❌ Erro ao buscar detalhes do investidor:", error);
    console.error("❌ Parâmetros da chamada:", { propertyId, investorAddress });
    throw error;
  }
}

export async function getInvestorList(
  propertyId?: number
): Promise<InvestorData[] | null> {

  try {
    const response = await firmezaApiClient.post(`/getInvestorList`, {
      ...(propertyId !== undefined ? { propertyId } : {})
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      const investors: InvestorData[] = response.data.map((investor) => ({
        investorAddress: investor.investorAddress,
        propertyId: investor.propertyId,
        initTokensPercentNumber: investor.initTokensPercentNumber,
        initTokensPercentFormat: investor.initTokensPercentFormat,
        initRentValue: investor.initRentValue,
        initRentValueCurrency: investor.initRentValueCurrency,
        propertyTokens: investor.propertyTokens,
        propertyTokensCurrentFormat: investor.propertyTokensCurrentFormat,
        propertyTokensCurrency: investor.propertyTokensCurrency,
        rentYield:  investor.rentYield,
        rentYieldFee: investor.rentYieldFee,
        nextRentPayment: investor.nextRentPayment,
        nextRentPaymentCurrency: investor.nextRentPaymentCurrency,
        capitalValue: investor.capitalValue,
        capitalValueNumberFormat: investor.capitalValueNumberFormat,
        calcNextRentPaymentFee: investor.calcNextRentPaymentFee,
        calcNextRentPaymentFeeCurrency: investor.calcNextRentPaymentFeeCurrency,
        expectedTokensPurchase: investor.expectedTokensPurchase,
        expectedTokensPurchaseCurrency: investor.expectedTokensPurchaseCurrency,
        rePurchasedTokensCurrency: investor.rePurchasedTokensCurrency,
        rePurchasedTokensNumber: investor.rePurchasedTokensNumber,
        rePurchasedTokensNumberFormat: investor.rePurchasedTokensNumberFormat,
        rePurchasedTokensPercent: response.data.rePurchasedTokensPercent,
        rePurchasedTokensPercentFormat: response.data.rePurchasedTokensPercentFormat,
        rePurchasedTokensPercentMissing: response.data.rePurchasedTokensPercentMissing,
        rePurchasedTokensPercentMissingFormat: response.data.rePurchasedTokensPercentMissingFormat,
        percentageInvested: investor.percentageInvested,
        percentageInvestedNumber: investor.percentageInvestedNumber,
        profile: Number(investor.profile),
        totalMonthly: response.data.totalMonthly,    
        totalInvestors: response.data.length,
        maintenanceExpectedCurrency: "R$ 0,00" // Default value for list view 
      }));      

      return investors;
    } else {
      const errorMessage = propertyId 
        ? `Nenhum investidor encontrado para a propriedade ${propertyId}`
        : "Nenhum investidor encontrado";
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Erro ao buscar lista de investidores:", error);
    return null; 
  }
}

export async function getInvoiceBD(invoiceId: number): 
  Promise<InvoiceBD | null> {
  try {
    const response = await firmezaApiClient.post(`/getInvoiceBD`, {
      invoiceId: invoiceId
    });

      if (response.status === 200 && response.data.invoice) {
      const invoiceData = response.data.invoice;
      
      const result = {
        invoiceId: Number(invoiceData.invoiceId),
        status: Number(invoiceData.status),
        path: invoiceData.path || '',
      };
      
      return result;
    } else {
      throw new Error(`Unexpected response status or missing invoice data`);
    }
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      // Garantir que os logs de erro também sejam seguros
      const safeErrorData = JSON.stringify(error.response.data, null, 2).replace(/[^\x20-\x7E\n\r\t]/g, '');
      console.error("[getInvoiceBD] Response data:", safeErrorData);
      console.error("[getInvoiceBD] Response status:", error.response.status);
    }
    return null; 
  }
}

async function getInvoiceInternal(invoiceId?: number, 
  propertyId?: number, status?: number): Promise<InvoiceData | InvoiceData[] | null> {
 
  try {
    
    const requestBody: any = {};
    if (invoiceId !== undefined) {
      requestBody.invoiceId = invoiceId;
    }    
    if (propertyId !== undefined) {
      requestBody.propertyId = propertyId;
    } 
    if (status !== undefined) {
      requestBody.status = status;
    }

    //console.log('Fetching invoice with params:', requestBody);

    const response = await authenticatedFirmezaFetch(`/getInvoiceListManager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch invoice data');
    }

    // Get the response text first to check if it's valid JSON
    const responseText = await response.text();
   //console.log('📝 Resposta raw da API getInvoiceListManager:', responseText);

    // Check if the response is valid JSON
    if (!responseText || responseText.trim() === '' || 
        responseText.includes('Sem metada') || 
        responseText.includes('Sem metadados') ||
        responseText.startsWith('Sem metadados para o token')) {
      console.error('❌ Resposta inválida da API getInvoiceListManager:', responseText);
      throw new Error('No metadata available for this invoice: ' + responseText);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta JSON:', parseError);
      console.error('❌ Resposta que causou o erro:', responseText);
      throw new Error('Invalid JSON response from API');
    }

    //console.log('API response data:', data);

    if (!data) {
      console.log('No data returned from API');
      return null;
    }

    // Helper function to map invoice data
    const mapInvoiceData = (item: any) => {
      //console.log('Mapping invoice data:', item);
      return {
        ...(propertyId !== undefined ? { propertyId } : {}),
        invoiceId: Number(item.invoiceId),
        propertyId: item.propertyId,
        dueDate: (item.invoiceType === 1 || item.invoiceType === 2) ? formatDateFromTimestamp(Number(item.dueDateNumber)) : item.dueDate,
        paymentDate: item.paymentDate,
        dueDateNumber: Number(item.dueDateNumber),
        todayNumber: Number(item.todayNumber),
        currentRentAsOwnerValue: item.currentRentAsOwnerValue,
        currentRentAsOwnerValueNumber: item.currentRentAsOwnerValueNumber,
        rentValueFee: item.rentValueFee,
        rentValueFeeNumber: item.rentValueFeeNumber,
        condoFee: item.condoFee,
        condoFeeNumber: item.condoFeeNumber,
        tokensToBuy: Number(item.tokensToBuy),
        tokensToBuyCurrency: item.tokensToBuyCurrency,
        tokensToBuyFee: item.tokensToBuyFee,
        tokensToBuyFeeNumber: item.tokensToBuyFeeNumber,
        propertyTax: item.propertyTax,
        propertyTaxCurrency: item.propertyTaxCurrency,
        maintenanceAsOwnerValue: item.maintenanceAsOwnerValue,
        maintenanceAsOwnerNumber: item.maintenanceAsOwnerNumber,
        maintenanceTotal: item.maintenanceTotal,
        percentBuyer: item.percentBuyer,
        status: item.status,
        statusDescription: item.statusDescription,
        statusBD: item.statusBD,
        path: item.path,
        invoiceType: item.invoiceType,
        invoiceTypeDescription: item.invoiceTypeDescription,
        totalInvoice: item.totalInvoice,
        cancellationDate: item.cancellationDate,
        cancellationReason: item.reasonCancel,
        penalty: item.penalty,
        penaltyCurrency: item.penaltyCurrency,
        interest: item.interest,
        interestCurrency: item.interestCurrency,
        earlyDays: item.earlyDays,
        delayDays: item.delayDays
      };
    };

    // If we're querying for a specific invoice ID
    if (invoiceId !== undefined) {
      // If data is an array, find the matching invoice
      if (Array.isArray(data)) {
        console.log('Response is an array with', data.length, 'items');
        // Try to find the invoice in the array
        const matchingInvoice = data.find(item => Number(item.invoiceId) === invoiceId);
        if (matchingInvoice) {
          console.log('Found matching invoice:', matchingInvoice);
          return mapInvoiceData(matchingInvoice);
        }
        // If not found in array, try to get all invoices without filter
        console.log('No matching invoice found in array, fetching all invoices');
        const allInvoicesResponse = await authenticatedFirmezaFetch(`/getInvoiceListManager`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        if (allInvoicesResponse.ok) {
          const allResponseText = await allInvoicesResponse.text();
          //console.log('📝 Resposta raw da API getInvoiceListManager (all):', allResponseText);
          
          // Check if the response is valid JSON
          if (!allResponseText || allResponseText.trim() === '' || 
              allResponseText.includes('Sem metada') || 
              allResponseText.includes('Sem metadados') ||
              allResponseText.startsWith('Sem metadados para o token')) {
            console.error('❌ Resposta inválida da API getInvoiceListManager (all):', allResponseText);
            return null;
          }
          
          let allData;
          try {
            allData = JSON.parse(allResponseText);
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse da resposta JSON (all):', parseError);
            return null;
          }
          
          if (Array.isArray(allData)) {
            const matchingInvoiceFromAll = allData.find(item => Number(item.invoiceId) === invoiceId);
            if (matchingInvoiceFromAll) {
              console.log('Found matching invoice in full list:', matchingInvoiceFromAll);
              return mapInvoiceData(matchingInvoiceFromAll);
            }
          }
        }
        console.log('No matching invoice found in full list');
        return null;
      }
      // If data is a single object
      console.log('Response is a single object');
      return mapInvoiceData(data);
    }

    // If we're querying for multiple invoices
    if (Array.isArray(data)) {
      //console.log('Mapping multiple invoices, count:', data.length);
      return data.map(mapInvoiceData);
    }

    // If we got a single invoice when expecting multiple
    console.log('Got single invoice when expecting multiple');
    return [mapInvoiceData(data)];
  } catch (error) {
    console.error("Erro ao buscar invoice:", error);
    return null;
  }
}

export async function getInvoiceOrRentDetail(propertyId: number): Promise<InvoiceData | null> {
  try {

      const response = await firmezaApiClient.post(`/getInvoiceOrRentDetail`, {
        propertyId,
      });
  
      // Check if response data is valid
      if (typeof response.data === 'string' && (
          response.data.includes('Sem metada') || 
          response.data.includes('Sem metadados') ||
          response.data.startsWith('Sem metadados para o token'))) {
        console.error("❌ Resposta inválida da API getInvoiceOrRentDetail:", response.data);
        throw new Error("No metadata available for this invoice/rent: " + response.data);
      }
  
      if (response.status === 200) {

      // Criar um objeto InvoiceData com as informações do RentDetail
      const invoiceData: InvoiceData = {
        invoiceId: response.data.invoiceId,
        propertyId: response.data.propertyId,
        dueDate: response.data.dueDate,
        dueDateNumber: response.data.dueDateNumber,
        todayNumber: response.data.todayNumber,
        paymentDate: "",
        currentRentAsOwnerValue: response.data.currentRentAsOwnerValue,
        currentRentAsOwnerValueNumber: response.data.currentRentAsOwnerValueNumber,
//        rentValueFee: response.data.profile === 4 ? 0 : response.data.rentValueFee,
//        rentValueFeeNumber: response.data.profile === 4 ? 0 : response.data.rentValueFeeNumber,
        rentValueFee: response.data.rentValueFee,
        rentValueFeeNumber: response.data.rentValueFeeNumber,
        condoFee: response.data.condoFee,
        condoFeeNumber: response.data.condoFeeNumber,
        tokensToBuy: response.data.tokensToBuy,
        tokensToBuyCurrency: response.data.tokensToBuyCurrency,
        tokensToBuyFee: response.data.tokensToBuyFee,
        tokensToBuyFeeNumber: response.data.tokensToBuyFeeNumber,
        propertyTax: response.data.propertyTax,
        propertyTaxCurrency: response.data.propertyTaxCurrency,
        penalty: response.data.penalty,
        penaltyCurrency: response.data.penaltyCurrency,
        interest: response.data.interest,
        interestCurrency: response.data.interestCurrency,
        earlyDays: response.data.earlyDays,
        delayDays: response.data.delayDays,
        maintenanceAsOwnerValue: response.data.maintenanceAsOwnerValue,
        maintenanceAsOwnerNumber: response.data.maintenanceAsOwnerNumber,
        maintenanceTotal: response.data.maintenanceTotal,
        percentBuyer: response.data.percentBuyer,
        status: response.data.status,
        statusDescription: response.data.statusDescription,
        invoiceType: response.data.invoiceType,
        invoiceTypeDescription: response.data.invoiceTypeDescription,
        totalInvoice: response.data.totalInvoice,
        statusBD: response.data.statusBD,
        path: response.data.path
      };

      return invoiceData;
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar invoice ou rent detail:", error);
    return null;
  }
}

export async function getInvoice(invoiceId?: number, propertyId?: number, status?: number): Promise<InvoiceData | InvoiceData[] | null> {
  const cacheKey = APICache.generateKey('getInvoice', { invoiceId, propertyId, status });
  
  // Skip cache for single invoice lookups to ensure fresh data
  if (invoiceId !== undefined) {
    console.log('Skipping cache for single invoice lookup:', invoiceId);
    try {
      const result = await getInvoiceInternal(invoiceId, propertyId, status);
      if (result) {
        // Update cache with fresh data
        APICache.set(cacheKey, result);
      }
      return result;
    } catch (error) {
      console.error("Erro ao buscar boleto via getInvoice:", error);
      return null;
    }
  }

  // For list queries, check cache first
  const cachedData = APICache.get<InvoiceData | InvoiceData[] | null>(cacheKey);
  if (cachedData) {
    console.log('Returning cached invoice data');
    return cachedData;
  }

  try {
    const result = await getInvoiceInternal(invoiceId, propertyId, status);
    if (result) {
      APICache.set(cacheKey, result);
    }
    return result;
  } catch (error) {
    console.error("Erro ao buscar boleto via getInvoice:", error);
    return null;
  }
}

function mapMaintenanceData(data: any[], propertyId: number): MaintenanceData[] {
  return data.map((maintenance) => ({
    maintenanceId: Number(maintenance.maintenanceId),
    propertyId: Number(propertyId),
    invoiceId: Number(maintenance.invoiceId),
    descriptionItem: maintenance.descriptionItem || "",
    resolutionItem: maintenance.resolutionItem || "",
    metadataItem: maintenance.metadataItem || "",
    priceResolution: maintenance.priceResolution || "",
    nextDatePaymentRent: maintenance.nextDatePaymentRent || "",
    dateCreated: maintenance.created || "",
    cancelled: maintenance.cancelled || false,
    maintenanceAsOwner: maintenance.maintenanceAsOwner || "",
    // Mapear os campos corretos da API para os campos esperados pelo frontend
    maintenanceDiscountCo: maintenance.maintenanceAsOwner || "",  // Valor proporcional
    percentageInvest: maintenance.percentBuyer || "",  // Percentual de participação
    percentBuyer: maintenance.percentBuyer || "",
    cancellationReason: maintenance.reasonCancel || ""
   }));
}

/**
 * Mapeia dados de manutenção para investidor específico usando a nova estrutura da API
 * @param data Array de dados de manutenção da API (maintenanceInvestorData)
 * @param propertyId ID da propriedade
 * @param investorAddress Endereço do investidor para buscar dados específicos
 * @returns Array de dados de manutenção com valores específicos do investidor
 */
function mapMaintenanceDataForInvestor(data: any[], propertyId: number, investorAddress: string): MaintenanceData[] {
  if (!Array.isArray(data)) {
    console.error("mapMaintenanceDataForInvestor: data deve ser um array");
    return [];
  }

  console.log(`🔍 Mapeando dados para investidor: ${investorAddress}`);

  return data.map((maintenance, index) => {
    if (!maintenance) {
      console.warn(`Manutenção ${index} é nula ou undefined`);
      return null;
    }

    try {
      // Validar maintenanceId
      const maintenanceId = Number(maintenance.maintenanceId);
      if (!maintenanceId || maintenanceId <= 0) {
        console.warn(`maintenanceId inválido para manutenção ${index}: ${maintenance.maintenanceId}`);
      }

      // Validar invoiceId
      const invoiceId = Number(maintenance.invoiceId);
      if (!invoiceId || invoiceId <= 0) {
        console.warn(`invoiceId inválido para manutenção ${maintenanceId}: ${maintenance.invoiceId}`);
      }

      // Formatar data criação
      const dateCreated = maintenance.created || maintenance.dateCreated || "";
      if (!dateCreated) {
        console.warn(`Data de criação ausente para manutenção ${maintenanceId}`);
      }

      // Buscar dados específicos do investidor no array investors
      let investorData = null;
      if (Array.isArray(maintenance.investors)) {
        investorData = maintenance.investors.find((investor: any) => 
          investor.investorAddress && 
          investor.investorAddress.toLowerCase() === investorAddress.toLowerCase()
        );
      }

      console.log(`🔍 Mapeando manutenção ${maintenanceId}:`);
      console.log('  - maintenance.investors:', maintenance.investors?.length || 0, 'investidores');
      console.log('  - investorData encontrado:', !!investorData);
      
      if (investorData) {
        console.log('  - investorData.maintenanceDiscount:', investorData.maintenanceDiscount);
        console.log('  - investorData.percentageInvest:', investorData.percentageInvest);
      } else {
        console.warn(`⚠️ Dados do investidor ${investorAddress} não encontrados para manutenção ${maintenanceId}`);
      }

      return {
        maintenanceId,
        propertyId: Number(propertyId),
        invoiceId,
        descriptionItem: String(maintenance.descriptionItem || ""),
        resolutionItem: String(maintenance.resolutionItem || ""),
        metadataItem: String(maintenance.metadataItem || ""),
        priceResolution: String(maintenance.priceResolution || "R$ 0,00"),
        nextDatePaymentRent: String(maintenance.nextDatePaymentRent || ""),
        dateCreated,
        cancelled: Boolean(maintenance.cancelled),
        maintenanceAsOwner: String(maintenance.maintenanceAsOwner || "R$ 0,00"),
        // Usar dados específicos do investidor se encontrados
        maintenanceDiscountCo: String(investorData?.maintenanceDiscount || "R$ 0,00"),
        percentageInvest: String(investorData?.percentageInvest || "0%"),
        percentBuyer: String(maintenance.percentBuyer || "0%"),
        cancellationReason: String(maintenance.reasonCancel || "")
      };
    } catch (error) {
      console.error(`Erro ao mapear manutenção ${index}:`, error);
      return null;
    }
  }).filter(Boolean) as MaintenanceData[];  // Remove itens nulos
}

export async function getMaintenanceList(
  propertyId: number,
  invoiceId?: number
): Promise<MaintenanceData[] | null> {
  const cacheKey = APICache.generateKey('getMaintenanceList', { propertyId, invoiceId });
  const cachedData = APICache.get<MaintenanceData[] | null>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await firmezaApiClient.post(`/getMaintenanceList`, {
      propertyId,
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      const maintenances = mapMaintenanceData(response.data, propertyId);

      const filteredMaintenances = invoiceId
        ? maintenances.filter((m) => m.invoiceId === invoiceId)
        : maintenances;

      APICache.set(cacheKey, filteredMaintenances);
      return filteredMaintenances;
    } else {
      throw new Error(`Nenhuma manutenção encontrada para a propriedade ${propertyId}`);
    }
  } catch (error) {
    console.error("Erro ao buscar lista de manutenções:", error);
    return null;
  }
}
/**
 * Obtém lista de manutenções específicas para um investidor com dados reais de participação
 * @param propertyId ID da propriedade
 * @param investorAddress Endereço do investidor
 * @param invoiceId ID da fatura (opcional para filtrar)
 * @returns Array de dados de manutenção com valores proporcionais reais do investidor
 */
export async function getMaintenanceListInvestor(
  propertyId: number,
  investorAddress: string,
  invoiceId?: number
): Promise<MaintenanceData[] | null> {
  // Validação de entrada usando função utilitária
  const validation = validateMaintenanceParams(propertyId, investorAddress);
  if (!validation.isValid) {
    console.error(`getMaintenanceListInvestor: ${validation.errorMessage}`);
    return [];
  }

  // Gerar chave de cache
  const cacheKey = APICache.generateKey('getMaintenanceListInvestor', { 
    propertyId, 
    investorAddress: investorAddress.toLowerCase(),
    invoiceId 
  });
  
  const cachedData = APICache.get<MaintenanceData[]>(cacheKey);
  if (cachedData) {
    console.log(`Cache hit para getMaintenanceListInvestor: ${investorAddress}`);
    return cachedData;
  }

  try {
    console.log(`Buscando manutenções para investidor ${investorAddress} na propriedade ${propertyId}`);
    
    const maintenanceResponse = await firmezaApiClient.post(`/getMaintenanceListInvestor`, {
      propertyId, 
      investorAddress: investorAddress.toLowerCase()
    });
    console.log(`✅ Resposta getMaintenanceListInvestor (${maintenanceResponse.status}):`, maintenanceResponse.data);

    if (maintenanceResponse.status === 200) {
      // Validar e extrair dados da resposta
      const maintenanceData = validateMaintenanceResponse(maintenanceResponse);

      // Retorna array vazio se não há dados de manutenção
      if (!maintenanceData || maintenanceData.length === 0) {
        console.log(`Nenhuma manutenção encontrada para investidor ${investorAddress} na propriedade ${propertyId}`);
        return [];
      }

      console.log(`Dados da API recebidos para ${maintenanceData.length} manutenções`);
      console.log('🔍 Exemplo de dados brutos da API:', maintenanceData[0]);
      console.log('🔍 Todos os campos do primeiro item:', Object.keys(maintenanceData[0] || {}));
      
      const maintenances = mapMaintenanceDataForInvestor(maintenanceData, propertyId, investorAddress);
      console.log('🔍 Exemplo de dados mapeados:', maintenances[0]);
      console.log('🔍 Campos específicos mapeados:');
      console.log('  - percentageInvest:', maintenances[0]?.percentageInvest);
      console.log('  - maintenanceDiscountCo:', maintenances[0]?.maintenanceDiscountCo);

      // Ordenar por data de criação (mais recente primeiro)
      const sortedMaintenances = maintenances.sort((a: MaintenanceData, b: MaintenanceData) => {
        const dateA = new Date(a.dateCreated).getTime();
        const dateB = new Date(b.dateCreated).getTime();
        
        // Se as datas são inválidas, usar maintenanceId como fallback
        if (isNaN(dateA) || isNaN(dateB)) {
          return b.maintenanceId - a.maintenanceId;
        }
        
        return dateB - dateA;
      });

      // Filtrar por invoiceId se fornecido
      const filteredMaintenances = invoiceId
        ? sortedMaintenances.filter((m: MaintenanceData) => m.invoiceId === invoiceId)
        : sortedMaintenances;

      // Armazenar no cache
      APICache.set(cacheKey, filteredMaintenances);
      
      console.log(`Retornando ${filteredMaintenances.length} manutenções para investidor ${investorAddress}`);
      return filteredMaintenances;
    } else {
      // Retorna array vazio ao invés de lançar erro quando não há manutenções
      console.log(`Nenhuma manutenção encontrada para wallet ${investorAddress} (status: ${maintenanceResponse.status})`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Erro geral ao buscar lista de manutenções para investidor ${investorAddress}:`, error);
    
    // Verifica se o erro é relacionado a "não encontrado" ao invés de erro de rede
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      const requestUrl = error.config?.url || 'URL desconhecida';
      
      console.error(`❌ Erro HTTP ${statusCode} em ${requestUrl}:`, errorMessage);
      
      // Para erros 400, 404 ou 500, retorna array vazio (dados não encontrados)
      if (statusCode === 400 || statusCode === 404 || statusCode === 500) {
        console.log(`⚠️ Retornando array vazio devido ao erro ${statusCode} para investidor ${investorAddress}`);
        return [];
      }
      
      // Para outros erros HTTP, log mais detalhado
      if (statusCode && statusCode >= 500) {
        console.error(`❌ Erro do servidor (${statusCode}): Problema na API backend`);
      } else if (statusCode && statusCode >= 400) {
        console.error(`❌ Erro do cliente (${statusCode}): Problema com a requisição`);
        console.error(`❌ Parâmetros enviados: propertyId=${propertyId}, investorAddress=${investorAddress}`);
      }
    } else {
      // Erro de rede ou outro tipo de erro
      console.error(`❌ Erro não-HTTP:`, error);
    }
    
    return null;
  }
}

// //======================= events
export async function getTokensPurchasedList(propertyId?: number): Promise<TokensPurchasedType[] | null> {
  
  try {
    if (!propertyId) {
      throw new Error("propertyId é obrigatório");
    }

    const requestBody = {
      propertyId: propertyId
    };

    const response = await firmezaApiClient.post(`/getTokensPurchasedList`, requestBody);

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: TokensPurchasedType[] = response.data.map((result) => ({
        buyer: result.buyer,
        propertyId: result.propertyId,
        tokenAmount: result.tokenAmount,
        tokenAmountFormat: result.tokenAmountFormat,
        capitalValue: result.capitalValue,
        capitalValueFormat: result.capitalValueFormat,
        buyerPercent: result.buyerPercentage,
        buyerPercentFormat: result.buyerPercentageFormat,
        missingBuyer: result.missingBuyer,
        missingBuyerFormat: result.missingBuyerFormat,
        missingBuyerCurrency: result.missingBuyerCurrency,
        date: result.date,
        dateNumber: result.dateNumber,
        runningTotal: result.runningTotal,
        runningTotalFormat: result.runningTotalFormat,
      }));
      
      return list;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar lista de compra de tokens:", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      console.error(`API Error: ${message}`);
    }
    return null;
  }
}

export async function getTokensRePurchasedList(): Promise<TokensRePurchasedType[] | null> {

  try {
    const response = await firmezaApiClient.post(`/getTokensRePurchasedList`);

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: TokensRePurchasedType[] = response.data.map((result) => ({
        seller: result.seller,
        propertyId: result.propertyId,
        tokensPurchased: result.tokensPurchased,
        date: result.date,
        dateNumber: result.dateNumber,
      }));

      return list;
    } else {
      throw new Error("Nenhum token re-comprado");
    }
  } catch (error) {
    console.error("Erro ao buscar lista de re-compra de tokens (de co-proprietarios para comprador):", error);
    return []; 
  }
}


export async function getInvestorAndTokensList(
  investorAddress: string)
  : Promise<InvestorAndTokensType[] | null> {

  try {
    const response = await firmezaApiClient.post(`/getInvestorAndTokensList`, {
      investorAddress
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: InvestorAndTokensType[] = response.data.map((result) => ({
        propertyId: result.propertyId,
        investor: result.investorAddress,
        receiptDateNumber: result.receiptDateNumber,
        receiptDate: result.receiptDate,
        totalValue: result.totalValue,
        tokensRepurchased: result.tokensRepurchased,
        tokensRemainingNumber: result.tokensRemainingNumber,
        tokensRemaining: result.tokensRemaining,
        transactionValue: result.transactionValue,
        currentParticipation: result.currentParticipation
      }));

      return list;
    } else {
      throw new Error("Nenhum token re-comprado");
    }
  } catch (error) {
    console.error("Erro ao buscar lista de re-compra de tokens:", error);
    return []; 
  }
}

export async function getRentAdjustIGPMList(): Promise<RentAdjustmentType[] | null> {

  try {
    console.log("🔍 Chamando getRentAdjustIGPMList API...");
    const response = await firmezaApiClient.post(`/getRentAdjustIGPMList`);

    console.log("✅ Resposta da API getRentAdjustIGPMList:", response.data);

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: RentAdjustmentType[] = response.data.map((result) => ({
        admin: result.admin,
        propertyId: result.propertyId,
        initRentValue: result.initRentValue,
        currentRentValue: result.currentRentValue,
        percentAdjustment: result.percentAdjustment,
        newRentValue: result.newRentValue,
        tokensPurchased: result.tokensPurchased,
        date: result.date,
        dateTimestamp: Number(result.dateTimestamp),
        percentPurchased: "0",
        totalCumulative: 0,
        totalCumulativeFormatted: "0",
        missingBuyer: 0,
        missingBuyerFormatted: "0",
        missingBuyerCurrency: "0",
      }));

      console.log("✅ Lista de ajustes IGPM processada:", list);
      return list;
    } else {
      console.log("⚠️ Resposta não é um array ou status não é 200:", response.status, response.data);
      return [];
    }
  } catch (error) {
    console.error("❌ Erro ao buscar lista de ajuste de aluguel IGPM:", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("❌ Status:", axiosError.response?.status);
      console.error("❌ Data:", axiosError.response?.data);
      console.error("❌ Message:", axiosError.message);
    }
    return []; 
  }
}

export async function getRentAdjustPurchaseList(): Promise<RentAdjustmentType[] | null> {

  try {
    const response = await firmezaApiClient.post(`/getRentAdjustPurchaseList`);

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: RentAdjustmentType[] = response.data.map((result) => ({
        admin: "0",
        propertyId: result.propertyId,
        initRentValue: result.initRentValue || result.currentRentValue, // Fallback para currentRentValue se initRentValue não existir
        currentRentValue: result.currentRentValue,
        percentAdjustment: result.percentAdjustment,
        newRentValue: result.newRentValue,
        tokensPurchased: result.tokensPurchased,
        date: result.date,
        dateTimestamp: Number(result.dateTimestamp),
        percentPurchased: result.percentPurchased,
        totalCumulative: result.totalAmount,
        totalCumulativeFormatted: result.totalCumulativeFormatted,
        missingBuyer: result.missingBuyer,
        missingBuyerFormatted: result.missingBuyerFormatted,
        missingBuyerCurrency: result.missingBuyerCurrency,
      }));

      return list;
    } else {
      throw new Error("Nenhum ajuste de aluguel");
    }
  } catch (error) {
    console.error("Erro ao buscar lista de ajuste de aluguel :", error);
    return []; 
  }
}

export async function getDistributionRentList(): Promise<DistributionRentType[] | null> {

  try {
    const response = await firmezaApiClient.post(`/getDistributionRentList`);

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: DistributionRentType[] = response.data.map((result) => ({

        propertyId: result.propertyId,
        investor: result.investor,
        amount: result.amount,
        amountFee: result.amountFee,
        fee: result.fee,
        maintenanceDiscount: result.maintenanceDiscount,
        valueDiscount: result.valueDiscount,
        invoiceId: Number(result.invoiceId),
        dateExpected: result.dateExpected,
        date: result.date,
      }));

      return list;
    } else {
      throw new Error("Nenhuma distribuicao de aluguel");
    }
  } catch (error) {
    console.error("Erro ao buscar lista de distribuicao de aluguel :", error);
    return []; 
  }
}

export async function getInvestorJoinedList(): Promise<InvestorJoinedType[] | null> {

  try {
    const response = await firmezaApiClient.post(`/getInvestorJoinedList`);

    if (response.status === 200 && Array.isArray(response.data)) {
      const list: InvestorJoinedType[] = response.data.map((result) => ({
        propertyId: result.propertyId,
        investor: result.investor,
        tokensInvested: result.tokensInvested, 
        capitalValue: result.capitalValue,         
        date: result.date
      }));

      return list;
    } else {
      throw new Error("Nenhum Investidor");
    }
  } catch (error) {
    console.error("Erro ao buscar lista de inclusao de investidores :", error);
    return []; 
  }
}

export async function getFeeList(): Promise<{ fees: FeeType[]; totalValueCurrency: number } | null> {
  try {
    const response = await firmezaApiClient.post(`/getFeeList`);

    if (response.status === 200 && Array.isArray(response.data.fees)) {
      const list: FeeType[] = response.data.fees.map((result:any) => ({
        purchaseTenantCurrency: result.purchaseTenantCurrency,
        distrRentCurrency: result.distrRentCurrency,
        fmzYieldCurrency: result.fmzYieldCurrency,
        valueCurrency: result.valueCurrency,
        date: result.date,  
        invoiceId: result.invoiceId
      }));

      const totalValueCurrency = response.data.totalValueCurrency; // Captura o totalValue da resposta

      return { fees: list, totalValueCurrency }; // Retorna a lista e o total
    } else {
      throw new Error("Nenhuma Taxa Recebida");
    }
  } catch (error) {
    console.error("Erro ao buscar lista de taxas recebidas:", error);
    return null; // Retorna null em caso de erro
  }
}

//================== write function SC
export interface CreateInvoiceResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
  transactionHash?: string;
}

export async function createInvoice(
  propertyId: string, type: number, dueDate: string, 
  valueRent: string | null, condoFee: string | null, 
  propertyTax: string | null, tokensToBuy: number): Promise<CreateInvoiceResponse> {

    //type = 0; //automatic for rent data
    //type = 1; //single for rent data
    //type = 2; //single for purchase tokens

    const dueDateNumber = (type === 1 || type === 2) ? convertBrazilianDateToTimestamp(dueDate) : Number(dueDate);
    
    // Convert currency strings to numbers in cents (multiply by 100)
    const valueRentClean = (valueRent || "0").toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const condoFeeClean = (condoFee || "0").toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const propertyTaxClean = (propertyTax || "0").toString().replace(/[^\d.,]/g, '').replace(',', '.');
    
    // Convert to cents to avoid decimal numbers
    const valueRentNumber = Math.round(Number(valueRentClean) * 100);
    const condoFeeNumber = Math.round(Number(condoFeeClean) * 100);
    const propertyTaxNumber = Math.round(Number(propertyTaxClean) * 100);
    const tokensToBuyNumber = Number(tokensToBuy);

  try {

    const response = await authenticatedFirmezaFetch(`/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ propertyId: propertyId,
        invoiceType: type, 
        dueDate: dueDateNumber, 
        valueRent: valueRentNumber, 
        condoFee: condoFeeNumber, 
        propertyTax: propertyTaxNumber,
        tokensToBuy: tokensToBuyNumber
       }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao criar Invoice');
    }

    const result = await response.json();

    if (!result || !result.success) {
      throw new Error(result.message || 'Falha na criação da fatura');
    }
    
    return result;
  } catch (error) {
    console.error('Erro na requisição createInvoice:', error);
    if (error instanceof Error) {
      throw new Error(`Falha na criação da fatura: ${error.message}`);
    }
    throw new Error('Falha na criação da fatura: Erro desconhecido');
  }
}

export interface CreateMaintenanceResponse {
  success: boolean;
  message: string;
  maintenanceId?: string;
  transactionHash?: string;
}

export const createMaintenance = async (
  propertyId: string, 
  description: string = "", 
  resolution: string = "", 
  metadata: string = "", 
  priceResolution: string = "",
  dateCreated: string = ""
) => {
  try {
    const response = await authenticatedFirmezaFetch(`/createMaintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        propertyId,
        description,
        resolution,
        metadata,
        priceResolution,
        dateCreated
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao criar manutenção");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na API createMaintenance:", error);
    throw error;
  }
};


export async function processPaymentConfirmation(
  invoiceId: string, paymentDate: number, status:  number, 
  propertyId: number, penalty: string | null, interest: string | null
): Promise<{
  rentPayment: {
    success: boolean;
    message: string;
    invoiceId?: string;
    transactionHash?: string;
  },
  tokenPurchase: {
    success: boolean;
    message: string;
    invoiceId?: string;
    transactionHash?: string;
  }
}> {
  try {
    console.log("web3 dataxxxxxxxxxx:", invoiceId, paymentDate, 3, propertyId, penalty, interest);

       // Convert currency strings to numbers in cents (multiply by 100)
       const penaltyClean = (penalty || "0").toString().replace(/[^\d.,]/g, '').replace(',', '.');
       const interestClean = (interest || "0").toString().replace(/[^\d.,]/g, '').replace(',', '.');
       
       // Convert to cents to avoid decimal numbers
       const penaltyNumber = Math.round(Number(penaltyClean) * 100);
       const interestNumber = Math.round(Number(interestClean) * 100);
      

    const result = await processPaymentConfirmationInternal
    (invoiceId, paymentDate, status, propertyId, penaltyNumber, interestNumber);
    console.log("web3 convertedaxxxxxxxxxx:", invoiceId, paymentDate, 3, propertyId, penaltyNumber, interestNumber);

    // Invalidate relevant caches after successful mutation
    APICache.invalidate('getInvoice');
    APICache.invalidate('getMaintenanceList');
    return result;
  } catch (error) {
    throw error;
  }
}

export async function cancelInvoice(
  propertyId: string,
  invoiceId: string,
  reason: string
): Promise<{
  cancelInvoice: {
    success: boolean;
    message: string;
    invoiceId?: string;
    transactionHash?: string;
  }
}> {
  try {
    const result = await cancelInvoiceInternal(propertyId, invoiceId, reason);
    // Invalidate relevant caches after successful mutation
    APICache.invalidate('getInvoice');
    APICache.invalidate('getMaintenanceList');
    return result;
  } catch (error) {
    throw error;
  }
}

// Helper function to move the original processPaymentConfirmation logic
async function processPaymentConfirmationInternal(
  invoiceId: string, paymentDate: number, status: number,
  propertyId: number, penalty: number, interest: number
): Promise<any> {
  let rentPaymentResponse;
  let tokenPurchaseResponse;

  const response = await authenticatedFirmezaFetch(`/receiveRentalPayment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      propertyId: propertyId,
      invoiceId: invoiceId,
      paymentDate: paymentDate,
      distinctValue: 0,
      penalty: penalty,
      interest: interest,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao receber aluguel');
  }

  rentPaymentResponse = await response.json();

  try {
    const response = await authenticatedFirmezaFetch(`/purchaseTokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyId: propertyId,
        paymentDate: paymentDate,
        invoiceId: invoiceId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao transferir Tokens');
    }

    tokenPurchaseResponse = await response.json();
  } catch (error) {
    console.error('Erro na requisição purchaseTokens:', error);
    throw error;
  }

  // Atualizar o status da fatura no BD
  const updateResult = await updateInvoice(invoiceId, "", status);
  if (!updateResult.success) {
    console.error("Erro ao atualizar fatura");
  }

  return {
    rentPayment: rentPaymentResponse,
    tokenPurchase: tokenPurchaseResponse
  };
}

// Helper function to move the original cancelInvoice logic
async function cancelInvoiceInternal(
  propertyId: string,
  invoiceId: string,
  reason: string
): Promise<any> {
  const response = await authenticatedFirmezaFetch(`/cancelInvoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      propertyId: propertyId,
      invoiceId: invoiceId,
      reason: reason
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao excluir Invoice');
  }

  const cancelInvoiceResponse = await response.json();

  return {
    cancelInvoice: cancelInvoiceResponse
  };
}


export const setRentAdjustment = async (
  propertyId: number, 
  percentAdjustment: string = ""
) => {
  try {
    const response = await authenticatedFirmezaFetch(`/setRentAdjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        propertyId,
        percentAdjustment,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao fazer reajuste IGPM");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na API setRentAdjustment:", error);
    throw error;
  }
};



//=========calc
export async function getInvestmentGoal(
  propertyId: number
): Promise<InvestmentGoalType | null> {

  try {
    const response = await authenticatedFirmezaFetch(`/getInvestmentGoal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        propertyId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao buscar Objetivo do Comprador");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na API InvestmentGoal:", error);
    throw error;
  }
};


export async function getDistributionAndRePurchasedTokensList(propertyId: number, wallet?: string): Promise<DistributionRentAndTokensType[] | null> {

  try {
    // Construir o corpo da requisição com propertyId e wallet (se fornecidos)
    const requestBody: any = {};
    if (propertyId !== undefined) {
      requestBody.propertyId = propertyId;
    }
    if (wallet && wallet.trim() !== '') {
      requestBody.investorAddress = wallet;
    }
    
    const response = await firmezaApiClient.post(`/getDistributionAndRePurchasedTokensList`, requestBody);

    if (response.status === 200 && response.data.success && Array.isArray(response.data.data)) {
      
      
      // Primeiro, vamos mapear os dados básicos
      const list: DistributionRentAndTokensType[] = response.data.data.map((result: any) => ({
        propertyId: result.propertyId,
        investor: result.investorAddress,
        profile: result.profile,
        profileDescription: getStatusProfile(result.profile, (key: string) => key), // Adiciona descrição do perfil
        amountOriginal: result.amountOriginal,
        amount: result.amount,
        amountFee: result.amountFee,
        fee: result.fee,
        maintenanceDiscount: result.maintenanceDiscount,
        valueDiscount: result.valueDiscount || "R$ 0,00",
        rentYieldFMZ: result.rentYieldFMZ || "R$ 0,00",
        invoiceId: Number(result.invoiceId),
        tokensRepurchased: Number(result.tokensRePurchased),
        tokensRepurchasedNumber: result.tokensRePurchasedNumber,
        tokensRepurchasedCurrency: result.tokensRePurchasedCurrency,
        totalValue: result.transactionValue,
        tokensRemainingNumber: result.tokensRemainingNumber,
        tokensRemaining: result.tokensRemaining,
        tokensInvested: result.tokensInvested,
        tokensInvestedFormatted: result.tokensInvestedFormatted,
        currentParticipation: result.currentParticipation,
        dateExpected: result.dateExpected,
        dateExpectedNumber: result.dateExpectedNumber,
        date: result.date,
        dateNumber: result.dateNumber,
        type: result.type,
      }));
      
      return list;
    }
      throw new Error("Nenhuma distribuicao de aluguel encontrada");
    }
  catch (error) {
    console.error("Erro ao buscar lista de distribuicao de aluguel e recompra de tokens:", error);
    return []; 
  }
}

export async function getMaintenanceExpectedList(): Promise<MaintenanceExpectedType | null> {

  try {
    const response = await firmezaApiClient.post(`/getMaintenanceSummaryByInvestor`);

    if (response.status === 200 && response.data) {
      const result = response.data;
      
      const maintenanceExpected: MaintenanceExpectedType = {
        propertyId: result.propertyId,
        totalMaintenances: result.totalMaintenances,
        totalMaintenanceValue: result.totalMaintenanceValue,
        totalMaintenanceValueNumber: result.totalMaintenanceValueNumber,
        totalProportionalSum: result.totalProportionalSum,
        totalProportionalSumNumber: result.totalProportionalSumNumber,
        investorsCount: result.investorsCount,
        investorsSummary: result.investorsSummary.map((investor: any) => ({
          investorAddress: investor.investorAddress,
          percentageInvested: investor.percentageInvested,
          percentageInvestedNumber: investor.percentageInvestedNumber,
          totalProportionalValue: investor.totalProportionalValue,
          totalProportionalValueNumber: investor.totalProportionalValueNumber,
          maintenanceCount: investor.maintenanceCount,
        }))
      };
      
      return maintenanceExpected;
    } else {
      throw new Error("Nenhum dado de manutenção encontrado");
    }
  } catch (error) {
    console.error("Erro ao buscar dados de manutenção esperada:", error);
    return null;
  }
}

export interface UpdateInvoiceResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
  transactionHash?: string;
}

export async function updateInvoice(
  invoiceId: string,
  ipfsUrl: string | null,
  status: number
): Promise<UpdateInvoiceResponse> {
  try {
    
    const response = await firmezaApiClient.put(`/updateInvoiceBD`, {
      invoiceId: invoiceId,
      path: ipfsUrl,
      status: status
    });

    return {
      success: true,
      message: "Boleto atualizado com sucesso no BD",
      invoiceId: invoiceId,
      transactionHash: response.data.transactionHash
    };

  } catch (error) {
    console.error("[updateInvoiceWithBoleto] Erro ao atualizar boleto:", error);
    
    if (error instanceof AxiosError) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

export interface PinataMetadata {
  ipfsHash: string;
  gatewayUrl: string;
  pinataUrl: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
}

export async function updateInvoiceWithMetadata(
  invoiceId: string,
  ipfsUrl: string | null,
  status: number,
  metadata: PinataMetadata
): Promise<UpdateInvoiceResponse> {
  try {
    
    const response = await firmezaApiClient.put(`/updateInvoiceBD`, {
      invoiceId: invoiceId,
      path: ipfsUrl,
      status: status,
      metadata: JSON.stringify(metadata)
    });

    return {
      success: true,
      message: "Boleto atualizado com sucesso no BD com metadata",
      invoiceId: invoiceId,
      transactionHash: response.data.transactionHash
    };

  } catch (error) {
    console.error("[updateInvoiceWithMetadata] Erro ao atualizar boleto:", error);
    
    if (error instanceof AxiosError) {
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

/**
 * Realiza investimento em propriedade
 */
export async function investInProperty({
  propertyId,
  investorAddress,
  investmentValue,
  investmentDate,
  isLegacyClient = false
}: {
  propertyId: number;
  investorAddress: string;
  investmentValue: number;
  investmentDate: string;
  isLegacyClient?: boolean;
}) {
  try {
    console.log("🔍 Chamando investInProperty API...", {
      propertyId,
      investorAddress,
      investmentValue,
      investmentDate,
      isLegacyClient
    });

    const response = await firmezaApiClient.post(`/investInProperty`, {
      propertyId,
      investor: investorAddress,
      tokensToBuy: investmentValue,
      investmentDate: investmentDate,
      isLegacyClient: isLegacyClient
    });

    console.log("✅ Resposta da API investInProperty:", response.data);

    if (response.status === 200) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        message: response.data.message || "Investimento realizado com sucesso",
        data: response.data
      };
    } else {
      console.error("❌ Status inesperado da API:", response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("❌ Erro ao realizar investimento:", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`Erro no investimento: ${message}`);
    } else {
      throw new Error("Erro inesperado ao realizar investimento.");
    }
  }
}

export interface CancelMaintenanceResponse {
  success: boolean;
  message: string;
  maintenanceId?: string;
  transactionHash?: string;
}

export const cancelMaintenance = async (
  propertyId: string,
  maintenanceId: string,
  reason: string
): Promise<CancelMaintenanceResponse> => {
  try {
    const response = await firmezaApiClient.post(`/cancelMaintenance`, {
      propertyId,
      maintenanceId,
      reason
    });

    if (response.status === 200) {
      return response.data;
    }

    throw new Error(response.data?.message || 'Erro ao cancelar manutenção');
  } catch (error) {
    console.error('Erro na requisição cancelMaintenance:', error);
    
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    
    throw new Error('Erro ao cancelar manutenção');
  }
};

/**
 * Busca dados completos de manutenção e investidor usando a nova API específica
 * @param propertyId ID da propriedade
 * @param investorAddress Endereço do investidor
 * @returns Objeto combinado com dados de manutenção e investidor
 */
export async function getMaintenanceInvestorData(
  propertyId: number,
  investorAddress: string
): Promise<{
  investorData: InvestorData | null;
  maintenanceList: MaintenanceData[];
  maintenanceExpected: MaintenanceExpectedType | null;
  maintenanceTotal: string;
  error?: string;
} | null> {
  try {
    console.log(`🔍 Buscando dados completos para investidor ${investorAddress} na propriedade ${propertyId}`);

    // Validação de entrada
    const validation = validateMaintenanceParams(propertyId, investorAddress);
    if (!validation.isValid) {
      console.error(`getMaintenanceInvestorData: ${validation.errorMessage}`);
      return {
        investorData: null,
        maintenanceList: [],
        maintenanceExpected: null,
        maintenanceTotal: "R$ 0,00",
        error: validation.errorMessage
      };
    }

    // Chamar a nova API que retorna dados completos de manutenção do investidor
    const [
      investorDataResult,
      maintenanceInvestorResult
    ] = await Promise.allSettled([
      getInvestorDetail(propertyId, investorAddress),
      firmezaApiClient.post(`/getMaintenanceInvestorData`, {
        propertyId,
        investorAddress: investorAddress.toLowerCase()
      })
    ]);

    // Processar dados do investidor
    let investorData: InvestorData | null = null;
    if (investorDataResult.status === 'fulfilled') {
      investorData = investorDataResult.value;
      console.log(`✅ Dados do investidor carregados: ${investorData?.percentageInvested}`);
    } else if (investorDataResult.status === 'rejected') {
      console.warn(`⚠️ Falha ao carregar dados do investidor:`, investorDataResult.reason);
    }

    // Processar dados de manutenção do investidor
    let maintenanceList: MaintenanceData[] = [];
    let maintenanceTotal = "R$ 0,00";

    if (maintenanceInvestorResult.status === 'fulfilled' && maintenanceInvestorResult.value?.status === 200) {
      const response = maintenanceInvestorResult.value;
      console.log(`✅ Resposta getMaintenanceInvestorData:`, response.data);

      if (response.data && response.data.maintenanceInvestorData) {
        // Mapear dados das manutenções com informações específicas do investidor
        maintenanceList = mapMaintenanceDataForInvestor(
          response.data.maintenanceInvestorData, 
          propertyId, 
          investorAddress
        );

        // Usar o total do summary se disponível
        if (response.data.summary && response.data.summary.overallTotalDiscount) {
          maintenanceTotal = response.data.summary.overallTotalDiscount;
          console.log(`💰 Total de manutenção do summary: ${maintenanceTotal}`);
        } else if (maintenanceList.length > 0) {
          // Fallback: calcular soma dos valores proporcionais
          const total = maintenanceList.reduce((sum, maintenance) => {
            const value = parseBrazilianCurrency(maintenance.maintenanceDiscountCo || "R$ 0,00");
            return sum + value;
          }, 0);
          maintenanceTotal = formatBrazilianCurrency(total);
          console.log(`💰 Total calculado de manutenção: ${maintenanceTotal}`);
        }

        console.log(`✅ Lista de manutenções processada: ${maintenanceList.length} itens`);
      } else {
        console.log(`ℹ️ Nenhuma manutenção encontrada para investidor ${investorAddress}`);
      }
    } else if (maintenanceInvestorResult.status === 'rejected') {
      console.warn(`⚠️ Falha ao carregar dados de manutenção do investidor:`, maintenanceInvestorResult.reason);
    }

    const result = {
      investorData,
      maintenanceList,
      maintenanceExpected: null,
      maintenanceTotal
    };

    console.log(`✅ Dados combinados retornados para investidor ${investorAddress}`);
    return result;

  } catch (error) {
    console.error(`❌ Erro ao buscar dados combinados para investidor ${investorAddress}:`, error);
    return {
      investorData: null,
      maintenanceList: [],
      maintenanceExpected: null,
      maintenanceTotal: "R$ 0,00",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

// ===== INVESTORS NEXT PAYMENTS FUNCTIONS =====

/**
 * Tipo para dados de próximos pagamentos de investidores
 */
export type InvestorNextPaymentType = {
  propertyId: string;
  investorAddress: string;
  nextPaymentDate: string;
  nextPaymentDateNumber: number;
  amount: string;
  amountNumber: number;
  isPaid: boolean;
  paymentType: number;
};

/**
 * Busca todos os próximos pagamentos de investidores
 */
export async function getInvestorsNextPayments(): Promise<InvestorNextPaymentType[]> {
  const cacheKey = APICache.generateKey('getInvestorsNextPayments');
  const cached = APICache.get<InvestorNextPaymentType[]>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit for getInvestorsNextPayments');
    return cached;
  }

  try {
    console.log('🔍 Chamando getInvestorsNextPayments API...');
    const response = await firmezaApiClient.get(`/getInvestorsNextPayments`);

    console.log('✅ Resposta da API getInvestorsNextPayments:', response.data);

    if (response.status === 200) {
      const payments = Array.isArray(response.data) ? response.data : [];
      APICache.set(cacheKey, payments);
      return payments;
    } else {
      console.error('❌ Status inesperado da API:', response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar próximos pagamentos dos investidores:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error('Unexpected error occurred.');
    }
  }
}

/**
 * Busca próximos pagamentos de investidores por propriedade
 */
export async function getInvestorsNextPaymentsByProperty(propertyId: number): Promise<InvestorNextPaymentType[]> {
  const cacheKey = APICache.generateKey('getInvestorsNextPaymentsByProperty', { propertyId });
  const cached = APICache.get<InvestorNextPaymentType[]>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit for getInvestorsNextPaymentsByProperty');
    return cached;
  }

  try {
    console.log('🔍 Chamando getInvestorsNextPaymentsByProperty API...', { propertyId });
    const response = await firmezaApiClient.post(`/getInvestorsNextPaymentsByProperty`, {
      propertyId
    });

    console.log('✅ Resposta da API getInvestorsNextPaymentsByProperty:', response.data);

    if (response.status === 200) {
      const payments = Array.isArray(response.data) ? response.data : [];
      APICache.set(cacheKey, payments);
      return payments;
    } else {
      console.error('❌ Status inesperado da API:', response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar próximos pagamentos por propriedade:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error('Unexpected error occurred.');
    }
  }
}

/**
 * Busca próximos pagamentos de investidores por endereço do investidor
 */
export async function getInvestorsNextPaymentsByInvestor(investorAddress: string): Promise<InvestorNextPaymentType[]> {
  const cacheKey = APICache.generateKey('getInvestorsNextPaymentsByInvestor', { investorAddress });
  const cached = APICache.get<InvestorNextPaymentType[]>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit for getInvestorsNextPaymentsByInvestor');
    return cached;
  }

  try {
    console.log('🔍 Chamando getInvestorsNextPaymentsByInvestor API...', { investorAddress });
    const response = await firmezaApiClient.post(`/getInvestorsNextPaymentsByInvestor`, {
      investorAddress
    });

    console.log('✅ Resposta da API getInvestorsNextPaymentsByInvestor:', response.data);

    if (response.status === 200) {
      const payments = Array.isArray(response.data) ? response.data : [];
      APICache.set(cacheKey, payments);
      return payments;
    } else {
      console.error('❌ Status inesperado da API:', response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar próximos pagamentos por investidor:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error('Unexpected error occurred.');
    }
  }
}

/**
 * Busca próximo pagamento específico de um investidor em uma propriedade
 */
export async function getInvestorNextPayment(propertyId: number, investorAddress: string): Promise<InvestorNextPaymentType | null> {
  const cacheKey = APICache.generateKey('getInvestorNextPayment', { propertyId, investorAddress });
  const cached = APICache.get<InvestorNextPaymentType | null>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit for getInvestorNextPayment');
    return cached;
  }

  try {
    console.log('🔍 Chamando getInvestorNextPayment API...', { propertyId, investorAddress });
    const response = await firmezaApiClient.post(`/getInvestorNextPayment`, {
      propertyId,
      investorAddress
    });

    console.log('✅ Resposta da API getInvestorNextPayment:', response.data);

    if (response.status === 200) {
      // Verifica se há dados válidos na resposta
      if (!response.data || !response.data.investorAddress || response.data.investorAddress === '0x0000000000000000000000000000000000000000') {
        APICache.set(cacheKey, null);
        return null;
      }
      
      const payment = response.data as InvestorNextPaymentType;
      APICache.set(cacheKey, payment);
      return payment;
    } else {
      console.error('❌ Status inesperado da API:', response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar próximo pagamento do investidor:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error('Unexpected error occurred.');
    }
  }
}

/**
 * Busca a contagem total de próximos pagamentos de investidores
 */
export async function getInvestorsNextPaymentsCount(): Promise<number> {
  const cacheKey = APICache.generateKey('getInvestorsNextPaymentsCount');
  const cached = APICache.get<number>(cacheKey);
  if (cached !== null) {
    console.log('📦 Cache hit for getInvestorsNextPaymentsCount');
    return cached;
  }

  try {
    console.log('🔍 Chamando getInvestorsNextPaymentsCount API...');
    const response = await firmezaApiClient.get(`/getInvestorsNextPaymentsCount`);

    console.log('✅ Resposta da API getInvestorsNextPaymentsCount:', response.data);

    if (response.status === 200) {
      const count = typeof response.data === 'number' ? response.data : (response.data.count || 0);
      APICache.set(cacheKey, count);
      return count;
    } else {
      console.error('❌ Status inesperado da API:', response.status);
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar contagem de próximos pagamentos:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message;
      throw new Error(`${message}`);
    } else {
      throw new Error('Unexpected error occurred.');
    }
  }
}