export type FmzAdminDashboardMetrics = {
  users:      { total: number; thisMonth: number; lastMonth: number };
  tokens:     { volumeTotal: number; unit: string; thisMonth: number; lastMonth: number };
  invoices:   { volumeThisMonthBrl: string; volumeLastMonthBrl: string; percentageChangeVsLastMonth: number };
  properties: { total: number; available: number };
  pendingBoletos:     number;
  metricsRefreshedAt: string;
};

export type FmzAdminDashboardTopProperty = {
  id:            string;
  address:       string;
  neighborhood:  string;
  coOwnersCount: number;
  isOccupied:    boolean;
};

export type FmzAdminDashboardOverview = {
  metrics:       FmzAdminDashboardMetrics;
  topProperties: FmzAdminDashboardTopProperty[];
};

export type FmzActivityEventType =
  | 'token_purchase'
  | 'user_signup'
  | 'invoice_generated'
  | 'refund_approved'
  | 'property_added';

export type FmzAdminActivityEvent = {
  id:         string;
  eventType:  FmzActivityEventType;
  actorName?: string;
  title:      string;
  subtitle?:  string;
  relatedId?: string;
  createdAt:  string;
};
