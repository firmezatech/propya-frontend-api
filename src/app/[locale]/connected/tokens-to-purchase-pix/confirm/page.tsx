import { Suspense } from 'react';
import { FmzTenantTokenPurchaseConfirmPage } from '../../../../../features/tenant-portal/token-purchase/components/FmzTenantTokenPurchasePages';
import { FmzTokenPurchaseSkeleton } from '../../../../../components/layout';

export default function ConfirmTokenPurchasePage() {
  return (
    <Suspense fallback={<FmzTokenPurchaseSkeleton />}>
      <FmzTenantTokenPurchaseConfirmPage />
    </Suspense>
  );
}
