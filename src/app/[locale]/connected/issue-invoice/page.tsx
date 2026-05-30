import { Suspense } from 'react';
import { FmzInvoicePage } from '../../../../features/tenant-portal/invoices/components/FmzInvoicePage';
import { FmzInvoiceSkeleton } from '../../../../components/layout';

export default function TenantIssueInvoicePage() {
  return (
    <Suspense fallback={<FmzInvoiceSkeleton />}>
      <FmzInvoicePage />
    </Suspense>
  );
}
