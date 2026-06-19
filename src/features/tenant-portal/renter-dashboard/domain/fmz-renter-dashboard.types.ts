export type FmzDashboardMoneyLine = {
  key: string;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
};

export type FmzRenterDashboardMilestone = {
  percentage: number;
  label: string;
  amountLabel: string;
  visualPosition: number;
  status: 'done' | 'next' | 'future';
};

export type FmzRenterDashboardViewModel = {
  renterName: string;
  referenceMonthLabel: string;
  ownershipPercentage: number;
  ownershipPercentageLabel: string;
  monthlySavingsLabel: string;
  yearlySavingsLabel: string;
  acquiredTokensLabel: string;
  acquiredTokensNumber: number;
  remainingToOwnLabel: string;
  remainingToOwnNumber: number;
  propertyValueNumber: number;
  nextMilestonePercentage: number;
  nextMilestoneLabel: string;
  nextMilestoneRemainingLabel: string;
  nextMilestoneRemainingNumber: number;
  nextMilestoneProgressPercentage: number;
  nextMilestoneRentReductionLabel: string;
  nextMilestoneGapLabel: string;
  ownershipVisualPosition: number;
  journeyMilestones: FmzRenterDashboardMilestone[];
  currentRentLabel: string;
  currentRentNumber: number;
  originalRentLabel: string;
  originalRentNumber: number;
  rentPaidPercentage: number;
  rentCopy: string;
  // Simulator-specific fields — consumed only by FmzRenterDashboardRentSimulatorCard
  tokenBalance: number;
  totalTokenSupply: number;
  tokenUnitValue: number;
  baseRentForSimulation: number;
  invoice: {
    totalLabel: string;
    dueDateLabel: string;
    daysUntilDue: number | null;
    paymentUrl?: string | null;
    lines: FmzDashboardMoneyLine[];
  };
};
