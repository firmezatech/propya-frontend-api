'use client';

import type { FmzTenantDashboard } from '../../../features/tenant-portal/domain/fmz-tenant-portal.types';
import { FmzRenterDashboard } from '../../../features/renter-dashboard/components';
import type { FmzTenantPaymentHistoryItem } from '../../../features/tenant-portal/domain';

type DashboardRenterProps = {
  dashboard: FmzTenantDashboard;
  paymentHistory?: FmzTenantPaymentHistoryItem[];
};

export default function DashboardRenter({ dashboard, paymentHistory = [] }: DashboardRenterProps) {
  return (
    <FmzRenterDashboard
      dashboard={dashboard}
      paymentHistory={paymentHistory}
    />
  );
}
