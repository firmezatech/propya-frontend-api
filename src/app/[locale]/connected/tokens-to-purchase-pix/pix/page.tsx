import { Suspense } from 'react';
import { FmzTenantTokenPurchasePixPage } from '../../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzTokenPurchaseSkeleton } from '../../../../../components/layout';

export default function TokenPurchasePixPaymentPage() {
  return (
    <Suspense fallback={<FmzTokenPurchaseSkeleton />}>
      <FmzTenantTokenPurchasePixPage />
    </Suspense>
  );
}
