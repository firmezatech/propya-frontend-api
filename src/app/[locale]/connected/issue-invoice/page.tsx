import { Suspense } from 'react';
import { FmzInvoicePage } from '../../../../features/tenant-portal/invoices/components/FmzInvoicePage';
import { FmzInvoiceSkeleton, FmzTenantPageSkeletonFrame } from '../../../../components/layout';

export default function TenantIssueInvoicePage() {
  return (
    <Suspense
      fallback={
        <FmzTenantPageSkeletonFrame>
          <FmzInvoiceSkeleton />
        </FmzTenantPageSkeletonFrame>
      }
    >
      <FmzInvoicePage />
    </Suspense>
  );
}
