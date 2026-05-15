export type FmzDashboardMoneyLine = {
  key: string;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
};

export type FmzRenterDashboardMilestone = {
  percentage: number;
  label: string;
  caption: string;
  visualPosition: number;
  status: 'done' | 'next' | 'future';
};

export type FmzRenterDashboardQuickAction = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: number;
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
  nextMilestoneGapLabel: string;
  ownershipVisualPosition: number;
  journeyMilestones: FmzRenterDashboardMilestone[];
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
  quickActions: FmzRenterDashboardQuickAction[];
};
