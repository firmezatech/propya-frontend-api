import { Suspense } from 'react';
import { FmzTenantBoletoPaymentPage } from '../../../../../../../features/tenant-portal/token-purchase/components/FmzTenantBoletoPaymentPage';
import { FmzPageLoadingShell } from '../../../../../../../components/layout/FmzPageLoadingShell';

export default function TokenPurchaseBoletoPaymentPage() {
  return (
    <Suspense fallback={<FmzPageLoadingShell />}>
      <FmzTenantBoletoPaymentPage />
    </Suspense>
  );
}
