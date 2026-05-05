export type FmzDashboardMoneyLine = {
  key: string;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
};

export type FmzRenterDashboardViewModel = {
  renterName: string;
  referenceMonthLabel: string;
  ownershipPercentage: number;
  ownershipPercentageLabel: string;
  monthlySavingsLabel: string;
  yearlySavingsLabel: string;
  acquiredTokensLabel: string;
  remainingToOwnLabel: string;
  nextMilestonePercentage: number;
  nextMilestoneLabel: string;
  nextMilestoneRemainingLabel: string;
  nextMilestoneProgressPercentage: number;
  nextMilestoneRentReductionLabel: string;
  currentRentLabel: string;
  originalRentLabel: string;
  rentPaidPercentage: number;
  rentCopy: string;
  invoice: {
    totalLabel: string;
    dueDateLabel: string;
    paymentUrl?: string | null;
    lines: FmzDashboardMoneyLine[];
  };
};
