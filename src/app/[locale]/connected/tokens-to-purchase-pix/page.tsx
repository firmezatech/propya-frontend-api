import { Suspense } from 'react';
import { FmzTenantTokenPurchasePage } from '../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzTokenPurchaseSkeleton } from '../../../../components/layout';

export default function TokensToPurchasePixPage() {
  return (
    <Suspense fallback={<FmzTokenPurchaseSkeleton />}>
      <FmzTenantTokenPurchasePage />
    </Suspense>
  );
}
