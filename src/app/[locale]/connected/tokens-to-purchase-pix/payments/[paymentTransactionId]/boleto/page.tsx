import { Suspense } from 'react';
import { FmzTenantBoletoPaymentPage } from '../../../../../../../features/tenant-portal/token-purchase/components/FmzTenantBoletoPaymentPage';
import { FmzTokenPurchaseSkeleton } from '../../../../../../../components/layout';

export default function TokenPurchaseBoletoPaymentPage() {
  return (
    <Suspense fallback={<FmzTokenPurchaseSkeleton />}>
      <FmzTenantBoletoPaymentPage />
    </Suspense>
  );
}
