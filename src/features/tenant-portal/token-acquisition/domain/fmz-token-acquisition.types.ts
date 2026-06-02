// Token-acquisition celebration — frontend contract.
// Mirrors the backend buildTokenAcquisitionCelebration payload, delivered inside the
// `token_purchase_settled` notification's `metadata.celebration`. The page renders ONLY these
// fields; it never derives money/ownership numbers itself (the backend is the source of truth).

export type TokenAcquisitionCelebration = {
  property: {
    tokenizationId: string | null;
    label: string | null;
    currency: string;
    totalSupply: number;
    appraisedValue: number;
  };
  tokensAcquired: number;
  ownership: {
    previousPercentage: number;
    newPercentage: number;
    deltaPercentagePoints: number;
  };
  rent: {
    previousRentAmount: number;
    newRentAmount: number;
    monthlySavingsAmount: number;
    annualSavingsAmount: number;
  };
  equity: {
    previousValue: number;
    newValue: number;
    deltaValue: number;
  };
  tokenBalance: {
    previous: number;
    current: number;
  };
  nextGoal: {
    targetPercentage: number;
    targetTokenAmount: number;
    currentOwnershipPercentage: number;
    progressPercentage: number;
    tokensRemaining: number;
    projectedRentAtGoal: number | null;
  } | null;
  reference: {
    tokenOrderId: string | null;
    paymentTransactionId: string | null;
    notificationId: string | null;
    settledAt: string | null;
  };
};

// A pending celebration resolved from an unread notification: the payload + the notification id
// so the page can mark it read once shown (claim-once).
export type PendingTokenAcquisitionCelebration = {
  notificationId: string;
  celebration: TokenAcquisitionCelebration;
};
