import { Suspense } from 'react';
import { FmzPaymentHistoryPage } from '../../../../features/tenant-portal/payment-history/components/FmzPaymentHistoryPage';
import { FmzPageLoadingShell } from '../../../../components/layout/FmzPageLoadingShell';

export default function TenantPaymentHistoryPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzPaymentHistoryPage />
    </Suspense>
  );
}
