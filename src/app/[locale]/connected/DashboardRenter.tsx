'use client';

import type { InvoiceData, PropertyData, RentDetailData } from '../../../services/web3-api';
import { FmzRenterDashboard } from '../../../features/renter-dashboard/components';

type DashboardRenterProps = {
  rentDetail: RentDetailData | null;
  propertyDetail: PropertyData | null;
  invoiceData: InvoiceData | null;
  renterName?: string | null;
  referenceMonthLabel?: string | null;
};

export default function DashboardRenter({ rentDetail, propertyDetail, invoiceData, renterName, referenceMonthLabel }: DashboardRenterProps) {
  if (!propertyDetail || !rentDetail) {
    return null;
  }

  return (
    <FmzRenterDashboard
      propertyDetail={propertyDetail}
      rentDetail={rentDetail}
      invoiceData={invoiceData}
      renterName={renterName}
      referenceMonthLabel={referenceMonthLabel}
    />
  );
}
