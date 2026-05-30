import { Suspense } from 'react';
import { FmzTenantTokenPurchaseSuccessPage } from '../../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzTokenPurchaseSkeleton } from '../../../../../components/layout';

export default function TokenPurchaseSuccessPage() {
  return (
    <Suspense fallback={<FmzTokenPurchaseSkeleton />}>
      <FmzTenantTokenPurchaseSuccessPage />
    </Suspense>
  );
}
