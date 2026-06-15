// ─── Status ───────────────────────────────────────────────────────────────────

export type FmzRentChargeStatus = 'pending_validation' | 'open' | 'paid';

// ─── Summary strip ────────────────────────────────────────────────────────────

export type FmzRentChargeSummary = {
  pendingCount: number;
  doneCount: number;
  totalPendingVolumeBrl: string;
};

// ─── Charge amounts ───────────────────────────────────────────────────────────

export type FmzRentChargeAmounts = {
  tokenPurchase: string;
  discountedRent: string;
  platformAdminFee: string;
  tokenPurchaseFee: string;
  condominiumFee: string;
  gross: string;
};

// ─── Breakdown (how each number was calculated) ───────────────────────────────

export type FmzRentChargeBreakdown = {
  discountedRent: {
    baseRent: string;       // aluguel base sem desconto
    ownershipPct: string;   // % de posse do tenant
    discountAmount: string; // valor descontado em BRL
    result: string;         // aluguel após desconto
  };
  platformAdminFee: {
    feePct: string;         // % da taxa (ex: "10.00")
    appliedTo: string;      // base de cálculo (aluguel com desconto)
    result: string;         // valor da taxa em BRL
  };
};

// ─── Property in charge ───────────────────────────────────────────────────────

export type FmzRentChargeProperty = {
  id: string;
  address: string;
  neighborhood: string;
};

// ─── Tenant in charge ─────────────────────────────────────────────────────────

export type FmzRentChargeTenant = {
  userId: string;
  name: string;
  email: string;
  initials: string;
};

// ─── Token info in charge ────────────────────────────────────────────────────

export type FmzRentChargeTokens = {
  quantity: number;
  unitValueBrl: string;
  ownershipPercent: string;
};

// ─── Fee rates ────────────────────────────────────────────────────────────────

export type FmzRentChargeFeeRates = {
  rentAdminFeePercent: string;
  tokenPurchaseFeePercent: string;
  condominiumFeeAmount: string;
};

// ─── Full charge ─────────────────────────────────────────────────────────────

export type FmzAdminRentCharge = {
  id: string;
  status: FmzRentChargeStatus;
  competenceMonth: string;
  dueDate: string;
  rentalContractId: string;
  contractCode: string;
  property: FmzRentChargeProperty;
  tenant: FmzRentChargeTenant;
  tokens: FmzRentChargeTokens;
  amounts: FmzRentChargeAmounts;
  calculatedAmounts: FmzRentChargeAmounts;
  breakdown: FmzRentChargeBreakdown;
  feeRates: FmzRentChargeFeeRates;
  baseRentAmount: string;
  discountAmount: string;
  hasManualAdjustment: boolean;
};

// ─── List response ────────────────────────────────────────────────────────────

export type FmzAdminRentChargeListResponse = {
  summary: FmzRentChargeSummary;
  charges: FmzAdminRentCharge[];
};

// ─── List filters ─────────────────────────────────────────────────────────────

export type FmzAdminRentChargeFilters = {
  competenceMonth: string; // YYYY-MM-01 — obrigatório
  propertyId?: string;
  status?: FmzRentChargeStatus | '';
};

// ─── Adjust payload ───────────────────────────────────────────────────────────

export type FmzRentChargeAdjustPayload = {
  tokenPurchaseAmount: string;
  discountedRentAmount: string;
  platformAdminFeeAmount: string;
  tokenPurchaseFeeAmount: string;
  condominiumFeeAmount: string;
  reason: string;
};

// ─── Adjust response ─────────────────────────────────────────────────────────

export type FmzRentChargeAdjustResponse = {
  rentChargeId: string;
  grossAmount: string;
  hasManualAdjustment: boolean;
  adjustmentId: string;
};

/**
 * Os 5 campos editáveis pelo admin antes de validar.
 * Corresponde a `FmzRentChargeAmounts` sem o `gross` (calculado,
 * nunca editado diretamente).
 */
export type FmzRentChargeEditableValues = Omit<FmzRentChargeAmounts, 'gross'>;
