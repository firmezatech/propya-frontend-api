export type FmzTenantDashboardPayload = {
  success?: boolean;
  hasData?: boolean;
  reason?: string | null;
  dashboard?: FmzTenantDashboard | null;
  missingFields?: FmzTenantMissingField[];
};

export type FmzTenantMissingField = {
  field: string;
  reason?: string;
  recommendedSchemaSource?: string;
};

export type FmzTenantDashboard = {
  tenant?: FmzTenantProfile | null;
  competence?: {
    month?: string | null;
    label?: string | null;
  } | null;
  property?: FmzTenantProperty | null;
  contract?: FmzTenantContract | null;
  ownership?: FmzTenantOwnership | null;
  nextGoal?: FmzTenantNextGoal | null;
  monthlySummary?: FmzTenantMonthlySummary | null;
  rentInsight?: FmzTenantRentInsight | null;
  boleto?: FmzTenantBoleto | null;
  documents?: FmzTenantDocument[];
  parameters?: Record<string, unknown> | null;
};

export type FmzTenantProfile = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  initials?: string | null;
  phone?: string | null;
  phoneCountry?: string | null;
  birthdate?: string | null;
  birthDate?: string | null;
  address?: string | null;
  fullAddress?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressNumber?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  zipcode?: string | null;
  country?: string | null;
  wallet?: string | null;
  walletAddress?: string | null;
};

export type FmzTenantProperty = {
  id?: string | number | null;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  zipcode?: string | null;
  country?: string | null;
  registryNumber?: string | null;
  appraisedValue?: number | null;
  currency?: string | null;
};

export type FmzTenantAnnualAdjustment = {
  index?: string | null;
  label?: string | null;
  lastAdjustedAt?: string | null;
  nextAdjustmentDate?: string | null;
  lastRateBps?: number | null;
  lastRatePercentage?: number | null;
  description?: string | null;
};

export type FmzTenantContract = {
  id?: string | null;
  contractNumber?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  paymentDay?: number | null;
  status?: string | null;
  baseMonthlyRent?: number | null;
  originalBaseRent?: number | null;
  currentRentAmount?: number | null;
  currentRentSource?: string | null;
  rentAdjustmentIndex?: string | null;
  annualAdjustment?: FmzTenantAnnualAdjustment | null;
  nextAdjustmentDate?: string | null;
  lastAdjustedAt?: string | null;
  currency?: string | null;
  contractFileUrl?: string | null;
  documentUrl?: string | null;
  signedDocumentUrl?: string | null;
  signedAt?: string | null;
  importantTerms?: Record<string, unknown> | null;
};

export type FmzTenantOwnership = {
  currentPercentage?: number | null;
  currentOwnedValue?: number | null;
  tokenBalance?: number | null;
  pendingTokenBalance?: number | null;
  totalPropertyValue?: number | null;
  totalSupply?: number | null;
  tokenUnitValue?: number | null;
  amountRemainingToFullOwnership?: number | null;
};

export type FmzTenantNextGoal = {
  percentage?: number | null;
  amountNeeded?: number | null;
  goalValue?: number | null;
  progressToGoalPercentage?: number | null;
  estimatedMonthlyRentReduction?: number | null;
};

export type FmzTenantMonthlySummaryLine = {
  key: string;
  label: string;
  amount: number;
};

export type FmzTenantMonthlySummary = {
  rentChargeId?: string | null;
  dueDate?: string | null;
  status?: string | null;
  originalRentAmount?: number | null;
  rentWithDiscountAmount?: number | null;
  discountAmount?: number | null;
  rentalAdminFeeAmount?: number | null;
  condominiumAmount?: number | null;
  scheduledTokenPurchaseAmount?: number | null;
  tokenPurchaseFeeAmount?: number | null;
  totalDueAmount?: number | null;
  annualSavingsAmount?: number | null;
  currency?: string | null;
  lines?: FmzTenantMonthlySummaryLine[];
};

export type FmzTenantRentInsight = {
  currentRentAmount?: number | null;
  originalRentAmount?: number | null;
  monthlySavingsAmount?: number | null;
  annualSavingsAmount?: number | null;
  rentBarPercentage?: number | null;
};

export type FmzTenantBoleto = {
  paymentTransactionId?: string | null;
  status?: string | null;
  paymentProvider?: string | null;
  paymentMethod?: string | null;
  externalReference?: string | null;
  downloadUrl?: string | null;
  digitableLine?: string | null;
  barcode?: string | null;
  paidAt?: string | null;
};


export type FmzTenantDocument = {
  id?: string | null;
  entitySchema?: string | null;
  entityName?: string | null;
  entityId?: string | null;
  type?: string | null;
  fileName?: string | null;
  storagePath?: string | null;
  storageBucket?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  expiresAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

export type FmzTenantWallet = {
  id?: string | null;
  userId?: string | null;
  walletAddress?: string | null;
  publicKey?: string | null;
  chainId?: string | null;
  walletType?: string | null;
  custodyType?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
  assignedAt?: string | null;
  verifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FmzTenantPaymentHistoryItem = {
  id: string;
  reference: string;
  dueDate?: string | null;
  paidAt?: string | null;
  status?: string | null;
  amount: number;
  paymentProvider?: string | null;
  paymentMethod?: string | null;
  downloadUrl?: string | null;
  digitableLine?: string | null;
};
