function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

export type RentSimulationInput = {
  currentOwnedTokens: number;
  totalTokens: number;
  additionalTokens: number;
  baseRent: number;
  tokenUnitValue: number;
};

export type RentSimulationResult = {
  newOwnedTokens: number;
  maxAdditionalTokens: number;
  newOwnershipPercentage: number;
  newRentAmount: number;
  purchaseCost: number;
};

/**
 * Pure simulation of rent after buying additional tokens.
 *
 * Formula: newRent = baseRent × (1 − newOwnedTokens / totalTokens)
 * At 100% ownership newRent = 0. At current ownership newRent = currentRent.
 * All inputs are sanitised so the result is always deterministic and bounded.
 */
export function computeRentSimulation(input: RentSimulationInput): RentSimulationResult {
  const { currentOwnedTokens, totalTokens, additionalTokens, baseRent, tokenUnitValue } = input;

  const safeTotal = Math.max(Math.floor(totalTokens), 1);
  const safeCurrent = clamp(Math.floor(currentOwnedTokens), 0, safeTotal);
  const maxAdditionalTokens = safeTotal - safeCurrent;
  const safeAdditional = clamp(Math.floor(additionalTokens), 0, maxAdditionalTokens);

  const newOwnedTokens = safeCurrent + safeAdditional;
  const newOwnershipPercentage = clamp((newOwnedTokens / safeTotal) * 100, 0, 100);
  const newRentAmount = Math.max(Math.max(baseRent, 0) * (1 - newOwnedTokens / safeTotal), 0);
  const purchaseCost = safeAdditional * Math.max(tokenUnitValue, 0);

  return {
    newOwnedTokens,
    maxAdditionalTokens,
    newOwnershipPercentage,
    newRentAmount,
    purchaseCost,
  };
}
