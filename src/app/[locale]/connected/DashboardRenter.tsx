'use client';

import type { InvoiceData, PropertyData, RentDetailData } from '../../../services/web3-api';
import { FmzRenterDashboard } from '../../../features/renter-dashboard/components';

type DashboardRenterProps = {
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  invoiceData: InvoiceData | null;
};

export default function DashboardRenter({ rentDetail, propertyDetail, invoiceData }: DashboardRenterProps) {
  if (!propertyDetail || !rentDetail) {
    return null;
  }

  return (
    <FmzRenterDashboard
      propertyDetail={propertyDetail}
      rentDetail={rentDetail}
      invoiceData={invoiceData}
    />
  );
}
