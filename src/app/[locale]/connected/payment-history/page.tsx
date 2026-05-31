import { Suspense } from 'react';
import { FmzPaymentHistoryPage } from '../../../../features/tenant-portal/payment-history/components/FmzPaymentHistoryPage';
import { FmzPaymentHistorySkeleton, FmzTenantPageSkeletonFrame } from '../../../../components/layout';

export default function TenantPaymentHistoryPage() {
  return (
    <Suspense
      fallback={
        <FmzTenantPageSkeletonFrame>
          <FmzPaymentHistorySkeleton />
        </FmzTenantPageSkeletonFrame>
      }
    >
      <FmzPaymentHistoryPage />
    </Suspense>
  );
}
